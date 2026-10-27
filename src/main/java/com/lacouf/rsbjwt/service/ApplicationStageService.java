package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;
    private final DocumentRepository documentRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EntrevueRepository entrevueRepository;


    @Transactional
    public ApplicationStageDTO createApplicationStage1(
            Long idUtilisateur,
            Long idOffreDeStage
    ) throws BadRequestException {

        Utilisateur utilisateur =
                utilisateurRepository.findUtilisateurById(idUtilisateur);

        if (utilisateur == null) {
            throw new BadRequestException("Cet utilisateur n'existe pas");
        }

        if (!(utilisateur instanceof Etudiant etudiant)) {
            throw new BadRequestException(
                    "Seuls les étudiants peuvent postuler à une offre de stage."
            );
        }

        OffreDeStage offreDeStage =
                documentRepository.findOffreById(idOffreDeStage);

        if (offreDeStage == null) {
            throw new BadRequestException(
                    "Cette offre de stage n'existe pas"
            );
        }

        if (etudiant.getDiscipline() != null
                && offreDeStage.getTargetDiscipline() != null
                && etudiant.getDiscipline() != offreDeStage.getTargetDiscipline()) {
            throw new BadRequestException(
                    "Cette offre de stage ne correspond pas à votre discipline."
            );
        }

        if (applicationStageRepository
                .existsByEtudiantIdAndOffreDeStageId(
                        etudiant.getId(), offreDeStage.getId())) {
            throw new BadRequestException(
                    "Vous ne pouvez pas postuler deux fois à la même offre."
            );
        }

        if (applicationStageRepository
                .existsByOffreDeStageIdAndStatutValidation(
                        offreDeStage.getId(), StatutValidation.ACCEPTE)) {
            throw new BadRequestException(
                    "Cette offre de stage a déjà été attribuée à un autre étudiant."
            );
        }

        ApplicationStage applicationStage = new ApplicationStage();
        applicationStage.setEtudiant(etudiant);
        applicationStage.setOffreDeStage(offreDeStage);

        ApplicationStage sauvegarde =
                applicationStageRepository.save(applicationStage);

        return toDto(sauvegarde);
    }

    @Transactional
    public ApplicationStageDTO accepter(Utilisateur utilisateur, Long applicationId)
            throws BadRequestException, NotFoundException {
        ApplicationStage application = findApplicationOfEmployer(utilisateur, applicationId);
        verifierEnAttente(application);

        if (applicationStageRepository.existsByOffreDeStageIdAndStatutValidation(
                application.getOffreDeStage().getId(), StatutValidation.ACCEPTE))
            throw new BadRequestException("Cette offre de stage a déjà été attribuée à un autre étudiant.");

        application.setStatutValidation(StatutValidation.ACCEPTE);
        application.setCommentaireRefus(null);
        application.setDateDecision(LocalDateTime.now());

        Etudiant etudiant = application.getEtudiant();
        etudiant.setStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND);
        utilisateurRepository.save(etudiant);

        return toDto(applicationStageRepository.save(application));
    }

    @Transactional
    public ApplicationStageDTO refuser(Utilisateur utilisateur, Long applicationId, String commentaire)
            throws BadRequestException, NotFoundException {
        if (commentaire == null || commentaire.isBlank())
            throw new BadRequestException("Le commentaire est obligatoire pour refuser une candidature.");

        ApplicationStage application = findApplicationOfEmployer(utilisateur, applicationId);
        verifierEnAttente(application);

        application.setStatutValidation(StatutValidation.REJETE);
        application.setCommentaireRefus(commentaire.trim());
        application.setDateDecision(LocalDateTime.now());

        return toDto(applicationStageRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<Long> findAppliedOfferIds(Utilisateur utilisateur) throws BadRequestException {
        if (!(utilisateur instanceof Etudiant etudiant)) {
            throw new BadRequestException("Seuls les étudiants peuvent consulter leurs candidatures.");
        }

        return applicationStageRepository.findOfferIdsByEtudiantId(etudiant.getId());
    }

    @Transactional(readOnly = true)
    public List<ApplicationStageDTO> findApplicationsForStudent(Utilisateur utilisateur)
            throws BadRequestException {
        if (!(utilisateur instanceof Etudiant etudiant)) {
            throw new BadRequestException("Seuls les étudiants peuvent consulter leurs candidatures.");
        }

        return applicationStageRepository.findByEtudiantId(etudiant.getId())
                .stream()
                .map(application -> {
                    Long offerId = application.getOffreDeStage().getId();
                    OffreDeStageDTO offer = documentRepository.findOffreStageSummaryById(offerId)
                            .orElseThrow(() -> new IllegalStateException("Offre de stage introuvable"));
                    CV cv = documentRepository.findByUtilisateur(etudiant);

                    return new ApplicationStageDTO(
                            application.getId(),
                            application.getDateApplique(),
                            EtudiantDTO.of(etudiant),
                            offer,
                            application.getStatutValidation(),
                            cv == null ? null : cv.getId(),
                            cv == null ? null : cv.getFileName(),
                            application.getCommentaireRefus(),
                            hasInterview(application)
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationStageDTO> findApplicationsForEmployer(Utilisateur utilisateur, Long offreId)
            throws BadRequestException, NotFoundException {
        if (!(utilisateur instanceof Employeur)) {
            throw new BadRequestException("Seuls les employeurs peuvent consulter les candidatures reçues.");
        }

        OffreDeStage offre = documentRepository.findOffreStageById(offreId)
                .orElseThrow(() -> new NotFoundException("Offre de stage introuvable"));

        if (offre.getUtilisateur() == null
                || !offre.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new NotFoundException("Offre de stage introuvable");
        }

        return applicationStageRepository.findByOffreDeStageId(offreId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<EtudiantDTO> findEtudiantsByOffreDeStage(Long idOffreDeStage){
        return applicationStageRepository.findEtudiantsByOffreDeStage(idOffreDeStage)
                .stream()
                .map(EtudiantDTO::of)
                .toList();
    }

    public ApplicationStageDTO toDto(ApplicationStage applicationStage){
        CV cv = documentRepository.findByUtilisateur(applicationStage.getEtudiant());
        return  new ApplicationStageDTO(applicationStage.getId(),
                applicationStage.getDateApplique(),
                EtudiantDTO.of(applicationStage.getEtudiant()),
                OffreDeStageDTO.of(applicationStage.getOffreDeStage()),
                applicationStage.getStatutValidation(),
                cv == null ? null : cv.getId(),
                cv == null ? null : cv.getFileName(),
                applicationStage.getCommentaireRefus(),
                hasInterview(applicationStage));
    }

    private boolean hasInterview(ApplicationStage application) {
        return entrevueRepository.existsByStudentIdAndInternshipOfferId(
                application.getEtudiant().getId(),
                application.getOffreDeStage().getId());
    }

    private ApplicationStage findApplicationOfEmployer(Utilisateur utilisateur, Long applicationId)
            throws BadRequestException, NotFoundException {
        if (!(utilisateur instanceof Employeur)) {
            throw new BadRequestException("Seuls les employeurs peuvent traiter les candidatures reçues.");
        }

        ApplicationStage application = applicationStageRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Candidature introuvable"));

        Utilisateur proprietaire = application.getOffreDeStage().getUtilisateur();
        if (proprietaire == null || !proprietaire.getId().equals(utilisateur.getId())) {
            throw new NotFoundException("Candidature introuvable");
        }
        return application;
    }

    private void verifierEnAttente(ApplicationStage application) throws BadRequestException {
        if (application.getStatutValidation() != StatutValidation.EN_ATTENTE) {
            throw new BadRequestException("Cette candidature a déjà été traitée.");
        }
    }
}