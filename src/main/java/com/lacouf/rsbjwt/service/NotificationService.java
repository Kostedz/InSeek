package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.PreferenceNotificationRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import com.lacouf.rsbjwt.service.dto.PreferencesNotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final PreferenceNotificationRepository preferenceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CourrielService courrielService;

    @Value("${app.evaluation.alert-days:21}")
    private int alertDays;

    @Value("${app.mail.max-attempts:5}")
    private int maxTentatives;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.frontend.contract-path:/contrats/{id}}")
    private String contractPath;

    // ======================= Évaluation du stagiaire =======================

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
            String etudiant = nomComplet(contrat.getStudent());

            Notification notification = new Notification();
            notification.setDestinataire(employeur);
            notification.setType(TypeNotification.EVALUATION_STAGIAIRE);
            notification.setContrat(contrat);
            notification.setMessage("Le stage de " + etudiant + " se termine le "
                    + contrat.getEndingDate() + ". Veuillez remplir l'évaluation du stagiaire.");
            notification.setSujetCourriel("Évaluation du stagiaire à remplir / Intern evaluation required");
            notification.setCorpsCourriel(notification.getMessage()
                    + "\n\nConnectez-vous à InSeek pour remplir le formulaire."
                    + "\n\nThe internship of " + etudiant + " ends on " + contrat.getEndingDate()
                    + ". Please log in to InSeek to fill in the evaluation form.");
            tenterEnvoi(notification);
            crees++;
        }
        log.info("Alerte d'évaluation : {} notification(s) créée(s)", crees);
        return crees;
    }

    // ======================= Nouveau contrat =======================

    /** Appelée quand le contrat passe en attente de signature : notifie l'étudiant et l'employeur. */
    @Transactional
    public int notifierNouveauContrat(Contract contrat) {
        return notifierContrat(contrat, TypeNotification.NOUVEAU_CONTRAT);
    }

    /** Appelée quand un contrat est remplacé par une nouvelle version révisée. */
    @Transactional
    public int notifierContratRevise(Contract contrat) {
        return notifierContrat(contrat, TypeNotification.CONTRAT_REVISE);
    }

    private int notifierContrat(Contract contrat, TypeNotification type) {
        List<Utilisateur> destinataires = new ArrayList<>();
        if (contrat.getStudent() != null) destinataires.add(contrat.getStudent());
        if (contrat.getEmployer() != null) destinataires.add(contrat.getEmployer());

        int crees = 0;
        for (Utilisateur destinataire : destinataires) {
            if (notificationRepository.existsByTypeAndContratIdAndDestinataireId(
                    type, contrat.getId(), destinataire.getId())) {
                continue;
            }
            creerAlerteContrat(contrat, destinataire, type);
            crees++;
        }
        log.info("Contrat {} ({}) : {} notification(s) créée(s)", contrat.getId(), type, crees);
        return crees;
    }

    private void creerAlerteContrat(Contract contrat, Utilisateur destinataire, TypeNotification type) {
        boolean revise = type == TypeNotification.CONTRAT_REVISE;
        boolean estEtudiant = destinataire instanceof Etudiant;
        String lien = frontendUrl + contractPath.replace("{id}", String.valueOf(contrat.getId()));

        String messageFr = messageFr(contrat, revise, estEtudiant);
        String messageEn = messageEn(contrat, revise, estEtudiant);

        PreferenceNotification preference = preferenceRepository
                .findByUtilisateurId(destinataire.getId()).orElse(null);

        Notification notification = new Notification();
        notification.setDestinataire(destinataire);
        notification.setType(type);
        notification.setContrat(contrat);
        notification.setMessage(messageFr);
        notification.setLien(lien);
        // La préférence ne contrôle que l'In-App : le courriel transactionnel est toujours envoyé.
        notification.setInApp(preference == null || preference.isInAppActif());
        notification.setSujetCourriel(revise
                ? "Nouvelle version de votre contrat de stage / Revised internship contract"
                : "Nouveau contrat de stage / New internship contract");
        notification.setCorpsCourriel(messageFr + "\nAccéder au contrat : " + lien
                + "\n\n" + messageEn + "\nOpen the contract: " + lien);

        boolean envoye = tenterEnvoi(notification);
        if (!envoye) {
            alerterGestionnaire(contrat, destinataire);
        }
    }

    private String messageFr(Contract c, boolean revise, boolean estEtudiant) {
        String debut = revise ? "Une nouvelle version du contrat de stage" : "Un contrat de stage";
        String pour = estEtudiant ? "" : " pour " + nomComplet(c.getStudent());
        return debut + pour + " « " + poste(c) + " » chez " + entreprise(c) + ", " + periodeFr(c)
                + ", est en attente " + (estEtudiant ? "de votre signature." : "de signature.");
    }

    private String messageEn(Contract c, boolean revise, boolean estEtudiant) {
        String debut = revise ? "A revised version of the internship contract"
                : "An internship contract";
        String pour = estEtudiant ? "" : " for " + nomComplet(c.getStudent());
        return debut + pour + " \"" + poste(c) + "\" at " + entreprise(c) + ", " + periodeEn(c)
                + ", is awaiting " + (estEtudiant ? "your signature." : "signature.");
    }

    private String poste(Contract c) {
        return c.getInternshipOffer() == null || c.getInternshipOffer().getPosition() == null
                ? "stage" : c.getInternshipOffer().getPosition();
    }

    private String entreprise(Contract c) {
        return c.getEmployer() == null || c.getEmployer().getNomCompagnie() == null
                ? "l'entreprise" : c.getEmployer().getNomCompagnie();
    }

    private String periodeFr(Contract c) {
        return c.getStartingDate() == null || c.getEndingDate() == null
                ? "dates à confirmer" : "du " + c.getStartingDate() + " au " + c.getEndingDate();
    }

    private String periodeEn(Contract c) {
        return c.getStartingDate() == null || c.getEndingDate() == null
                ? "dates to be confirmed" : "from " + c.getStartingDate() + " to " + c.getEndingDate();
    }

    /** Prévient le GS qu'un courriel n'a pas pu être envoyé (une seule alerte par contrat). */
    private void alerterGestionnaire(Contract contrat, Utilisateur destinataire) {
        Gestionnaire gs = contrat.getAdmin();
        if (gs == null) return;
        if (notificationRepository.existsByTypeAndContratIdAndDestinataireId(
                TypeNotification.ECHEC_COURRIEL, contrat.getId(), gs.getId())) {
            return;
        }
        Notification alerte = new Notification();
        alerte.setDestinataire(gs);
        alerte.setType(TypeNotification.ECHEC_COURRIEL);
        alerte.setContrat(contrat);
        alerte.setMessage("Le courriel du contrat n'a pas pu être livré à " + nomComplet(destinataire)
                + " (" + destinataire.getEmail() + "). La notification dans l'application reste active "
                + "et le système réessaiera automatiquement.");
        notificationRepository.save(alerte);
    }

    // ======================= Envoi et reprise =======================

    private boolean tenterEnvoi(Notification notification) {
        boolean envoye = courrielService.envoyer(
                notification.getDestinataire().getEmail(),
                notification.getSujetCourriel(),
                notification.getCorpsCourriel());
        notification.setTentatives(notification.getTentatives() + 1);
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setStatutCourriel(envoye ? StatutEnvoiCourriel.ENVOYE : StatutEnvoiCourriel.ECHEC);
        notificationRepository.save(notification);
        return envoye;
    }

    /** File d'attente : renvoie les courriels en échec, jusqu'à maxTentatives. */
    @Scheduled(fixedDelayString = "${app.mail.retry-delay-ms:300000}")
    @Transactional
    public int reessayerCourriels() {
        List<Notification> enEchec = notificationRepository
                .findByStatutCourrielAndTentativesLessThan(StatutEnvoiCourriel.ECHEC, maxTentatives);
        int reussis = 0;
        for (Notification notification : enEchec) {
            if (tenterEnvoi(notification)) {
                reussis++;
            }
        }
        if (!enEchec.isEmpty()) {
            log.info("Reprise des courriels : {}/{} envoyé(s)", reussis, enEchec.size());
        }
        return reussis;
    }

    // ======================= Lecture =======================

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

    // ======================= Préférences =======================

    @Transactional(readOnly = true)
    public PreferencesNotificationDTO preferences(String email) throws NotFoundException {
        Utilisateur utilisateur = trouverUtilisateur(email);
        boolean inApp = preferenceRepository.findByUtilisateurId(utilisateur.getId())
                .map(PreferenceNotification::isInAppActif)
                .orElse(true);
        return new PreferencesNotificationDTO(inApp);
    }

    @Transactional
    public PreferencesNotificationDTO modifierPreferences(String email, boolean inAppActif)
            throws NotFoundException {
        Utilisateur utilisateur = trouverUtilisateur(email);
        PreferenceNotification preference = preferenceRepository.findByUtilisateurId(utilisateur.getId())
                .orElseGet(() -> {
                    PreferenceNotification p = new PreferenceNotification();
                    p.setUtilisateur(utilisateur);
                    return p;
                });
        preference.setInAppActif(inAppActif);
        preferenceRepository.save(preference);
        return new PreferencesNotificationDTO(inAppActif);
    }

    private Utilisateur trouverUtilisateur(String email) throws NotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
        if (utilisateur == null) {
            throw new NotFoundException("Utilisateur introuvable");
        }
        return utilisateur;
    }

    private String nomComplet(Utilisateur u) {
        return u == null ? "" : (u.getPrenom() + " " + u.getNom()).trim();
    }
}