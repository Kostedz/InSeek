package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;
    private final DocumentRepository documentRepository;

    public ApplicationStageService(
            ApplicationStageRepository applicationStageRepository,
            DocumentRepository documentRepository
    ) {
        this.applicationStageRepository = applicationStageRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public ApplicationStageDTO createApplicationStage(Utilisateur utilisateur, OffreDeStage offreDeStage) throws BadRequestException {
        if(! (utilisateur instanceof Etudiant etudiant))
            throw new BadRequestException("Seul les etudiants peuvent appliquer à une offrre de stage.");

        if(applicationStageRepository.existsByEtudiantIdAndOffreDeStageId(etudiant.getId(), offreDeStage.getId()))
            throw  new BadRequestException("Vous ne puvez pas appliquer à la même offre de stage plus qu'une fois.");

        if (applicationStageRepository.existsByOffreDeStageIdAndStatutValidation(offreDeStage.getId(), StatutValidation.ACCEPTE))
            throw new BadRequestException("Cette offre de stage a déjà été attribuée à un autre étudiant.");

        ApplicationStage applicationStage = new ApplicationStage();
        applicationStage.setEtudiant(etudiant);
        applicationStage.setOffreDeStage(offreDeStage);

        ApplicationStage sauvegarde = applicationStageRepository.save(applicationStage);
        return toDto(sauvegarde);
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

                    return new ApplicationStageDTO(
                            application.getId(),
                            application.getDateApplique(),
                            EtudiantDTO.of(etudiant),
                            offer,
                            application.getStatutValidation()
                    );
                })
                .toList();
    }

    public ApplicationStageDTO toDto(ApplicationStage applicationStage){
        return  new ApplicationStageDTO(applicationStage.getId(),
                                        applicationStage.getDateApplique(),
                                        EtudiantDTO.of(applicationStage.getEtudiant()),
                                        OffreDeStageDTO.of(applicationStage.getOffreDeStage()),
                                        applicationStage.getStatutValidation());
    }
}
