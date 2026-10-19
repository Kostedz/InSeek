package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApplicationStageDTO addApplicationStage(
            @PathVariable Long offreId,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {

        // P: bad ramses, bad. la logique d'auth ce fait dans le service.
        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

        // wtf, call au repo???? encore plus important que ça se passe dans le service
        OffreDeStage offreDeStage = documentRepository
                .findOffreStageById(offreId)
                .orElseThrow(() ->
                        new NotFoundException("Offre de stage introuvable")
                );

        return applicationStageService.createApplicationStage(
                utilisateur,
                offreDeStage
        );
    }

    @GetMapping("/my-applications")
    public List<Long> getMyApplications(Authentication authentication)
            throws BadRequestException, NotFoundException {
        // P: meme chose que en haut, la logique devrait etre dans le service
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
}
