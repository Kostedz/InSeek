package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;

    public ApplicationStageService (ApplicationStageRepository applicationStageRepository){
        this.applicationStageRepository = applicationStageRepository;
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

    public ApplicationStageDTO toDto(ApplicationStage applicationStage){
        return  new ApplicationStageDTO(applicationStage.getId(),
                                        applicationStage.getDateApplique(),
                                        EtudiantDTO.of(applicationStage.getEtudiant()),
                                        OffreDeStageDTO.of(applicationStage.getOffreDeStage()),
                                        applicationStage.getStatutValidation());
    }
}
