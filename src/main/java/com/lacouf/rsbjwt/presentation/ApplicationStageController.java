package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;

import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationStageController {

    private final ApplicationStageService applicationStageService;
    private final UtilisateurService utilisateurService;
    private final DocumentRepository documentRepository;


    // P: enleve le transactional du controlleur ramses sinon je vais te le foutre au cul
    // P: aussi utilise les ResponseEntity<T> pour renvoyer les infos avec leur code
    @PostMapping("/{offreId}")
    public ResponseEntity<ApplicationStageDTO> addApplicationStage(
            @PathVariable Long offreId,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService.findEntityByEmail(authentication.getName());
        ApplicationStageDTO dto = applicationStageService.createApplicationStage1(utilisateur.getId(), offreId);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{applicationId}/accept")
    public ApplicationStageDTO accepter(
            @PathVariable Long applicationId,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        return applicationStageService.accepter(utilisateur, applicationId);
    }

    @PutMapping("/{applicationId}/reject")
    public ApplicationStageDTO refuser(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        return applicationStageService.refuser(utilisateur, applicationId, body.get("commentaire"));
    }

    @GetMapping("/my-applications")
    public List<Long> getMyApplications(Authentication authentication)
            throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        return applicationStageService.findAppliedOfferIds(utilisateur);
    }

    @GetMapping("/my-applications/details")
    public List<ApplicationStageDTO> getMyApplicationDetails(Authentication authentication)
            throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        return applicationStageService.findApplicationsForStudent(utilisateur);
    }

    @GetMapping("/offer/{offreId}")
    public List<ApplicationStageDTO> getApplicationsForOffer(
            @PathVariable Long offreId,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        return applicationStageService.findApplicationsForEmployer(utilisateur, offreId);
    }


    @GetMapping("/employeur/offres/{offreId}/candidatures")
    public ResponseEntity<List<EtudiantDTO>> voirCandidatsAUneOffre(
            @PathVariable Long offreId
    ){
        return ResponseEntity.ok(applicationStageService.findEtudiantsByOffreDeStage(offreId));
    }
}