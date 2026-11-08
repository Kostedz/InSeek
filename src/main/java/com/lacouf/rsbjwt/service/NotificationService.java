package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final List<StatutContrat> STAGES_EN_COURS =
            List.of(StatutContrat.SIGNED_BY_GESTIONNAIRE, StatutContrat.EXECUTED);

    private final NotificationRepository notificationRepository;
    private final ContratRepository contratRepository;
    private final EvaluationStagiaireRepository evaluationRepository;
    private final CourrielService courrielService;

    @Value("${app.evaluation.alert-days:21}")
    private int alertDays;

    /** Notifie les employeurs dont le stage se termine dans <= alertDays jours et sans évaluation. */
    @Scheduled(cron = "${app.evaluation.cron:0 0 8 * * *}")
    @Transactional
    public int alerterEvaluationsStagiaires() {
        LocalDate today = LocalDate.now();
        List<Contract> contrats = contratRepository.findByContractStatusInAndEndingDateBetween(
                STAGES_EN_COURS, today, today.plusDays(alertDays));

        int crees = 0;
        for (Contract contrat : contrats) {
            if (contrat.getEmployer() == null) continue;
            if (evaluationRepository.existsByContratId(contrat.getId())) continue;
            if (notificationRepository.existsByTypeAndContratId(
                    TypeNotification.EVALUATION_STAGIAIRE, contrat.getId())) continue;

            Employeur employeur = contrat.getEmployer();
            String etudiant = (contrat.getStudent().getPrenom() + " " + contrat.getStudent().getNom()).trim();

            Notification notification = new Notification();
            notification.setDestinataire(employeur);
            notification.setType(TypeNotification.EVALUATION_STAGIAIRE);
            notification.setContrat(contrat);
            notification.setMessage("Le stage de " + etudiant + " se termine le "
                    + contrat.getEndingDate() + ". Veuillez remplir l'évaluation du stagiaire.");
            notificationRepository.save(notification);
            crees++;

            courrielService.envoyer(
                    employeur.getEmail(),
                    "Évaluation du stagiaire à remplir / Intern evaluation required",
                    notification.getMessage()
                            + "\n\nConnectez-vous à InSeek pour remplir le formulaire."
                            + "\n\nThe internship of " + etudiant + " ends on " + contrat.getEndingDate()
                            + ". Please log in to InSeek to fill in the evaluation form.");
        }
        log.info("Alerte d'évaluation : {} notification(s) créée(s)", crees);
        return crees;
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> lister(String email) {
        return notificationRepository.findByDestinataireEmail(email).stream()
                .map(NotificationDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public long compterNonLues(String email) {
        return notificationRepository.countNonLuesByEmail(email);
    }

    @Transactional
    public NotificationDTO marquerLue(Long id, String email) throws NotFoundException {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification introuvable"));
        if (!notification.getDestinataire().getEmail().equalsIgnoreCase(email)) {
            throw new NotFoundException("Notification introuvable");
        }
        notification.setLue(true);
        return NotificationDTO.of(notificationRepository.save(notification));
    }
}