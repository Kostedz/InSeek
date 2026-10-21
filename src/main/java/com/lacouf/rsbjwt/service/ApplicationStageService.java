package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;
    private final DocumentRepository documentRepository;
    private final UtilisateurRepository utilisateurRepository;


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

    @Transactional
    public ApplicationStageDTO createApplicationStage1(Long idUtilisateur, Long idOffreDeStage) throws BadRequestException {

        if (utilisateurRepository.findUtilisateurById(idUtilisateur) == null)
            throw new BadRequestException("Cet utilisateur n'existe pas");

        if (documentRepository.findOffreById(idOffreDeStage) == null)
            throw new BadRequestException("Cet offre de stage n'existe pas");

        if(! (utilisateurRepository.findUtilisateurById(idUtilisateur) instanceof Etudiant etudiant))
            throw new BadRequestException("Seul les etudiants peuvent appliquer à une offrre de stage.");

        if (! (documentRepository.findOffreById(idOffreDeStage) instanceof OffreDeStage offreDeStage))
            throw new BadRequestException("Les étudiants peuvent seulement appliquer à des offres de stage.");

        if(applicationStageRepository.existsByEtudiantIdAndOffreDeStageId(idUtilisateur, idOffreDeStage))
            throw  new BadRequestException("Vous ne puvez pas appliquer à la même offre de stage plus qu'une fois.");

        if (applicationStageRepository.existsByOffreDeStageIdAndStatutValidation(offreDeStage.getId(), StatutValidation.ACCEPTE))
            throw new BadRequestException("Cette offre de stage a déjà été attribuée à un autre étudiant.");

        // P: c'est fine, mais tu pourrais juste faire un builder de ApplicationStage pour la consistence
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
                    CV cv = documentRepository.findByUtilisateur(etudiant);

                    return new ApplicationStageDTO(
                            application.getId(),
                            application.getDateApplique(),
                            EtudiantDTO.of(etudiant),
                            offer,
                            application.getStatutValidation(),
                            cv == null ? null : cv.getId(),
                            cv == null ? null : cv.getFileName()
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
                cv == null ? null : cv.getFileName());
    }
}
