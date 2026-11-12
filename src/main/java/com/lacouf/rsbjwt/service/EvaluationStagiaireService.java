package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.EvaluationStagiaireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EvaluationStagiaireService {

    private final EvaluationStagiaireRepository evaluationRepository;
    private final ContratRepository contratRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Transactional
    public Long soumettre(Long contratId, String commentaire, String employeurEmail)
            throws NotFoundException, BadRequestException, ConflictException {
        if (commentaire == null || commentaire.isBlank()) {
            throw new BadRequestException("Le commentaire d'évaluation est obligatoire.");
        }
        Utilisateur user = utilisateurRepository.findByEmail(employeurEmail);
        if (!(user instanceof Employeur employeur)) {
            throw new BadRequestException("Seuls les employeurs peuvent évaluer un stagiaire.");
        }
        Contract contrat = contratRepository.findById(contratId)
                .orElseThrow(() -> new NotFoundException("Contrat non trouvé"));
        if (contrat.getEmployer() == null || !contrat.getEmployer().getId().equals(employeur.getId())) {
            throw new NotFoundException("Contrat non trouvé");
        }
        if (evaluationRepository.existsByContratId(contratId)) {
            throw new ConflictException("L'évaluation de ce stagiaire a déjà été soumise.");
        }

        EvaluationStagiaire evaluation = new EvaluationStagiaire();
        evaluation.setContrat(contrat);
        evaluation.setEmployeur(employeur);
        evaluation.setCommentaire(commentaire.trim());
        evaluationRepository.save(evaluation);

        notificationRepository.marquerLuesPourContrat(contratId, TypeNotification.EVALUATION_STAGIAIRE);
        notificationService.notifierProfesseurNouvelleEvaluation(contrat);
        return evaluation.getId();
    }

    /** Consultation de l'évaluation par le professeur superviseur de l'étudiant. */
    @Transactional(readOnly = true)
    public EvaluationStagiaireDTO consulterPourProfesseur(Long contratId, String professeurEmail)
            throws NotFoundException {
        EvaluationStagiaire evaluation = evaluationRepository.findByContratId(contratId)
                .orElseThrow(() -> new NotFoundException("Évaluation non trouvée"));
        Etudiant etudiant = evaluation.getContrat().getStudent();
        boolean estSuperviseur = etudiant != null && etudiant.getProfesseur() != null
                && etudiant.getProfesseur().getEmail().equalsIgnoreCase(professeurEmail);
        if (!estSuperviseur) {
            throw new NotFoundException("Évaluation non trouvée");
        }
        return EvaluationStagiaireDTO.of(evaluation);
    }
}