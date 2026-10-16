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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationStageController {

    private final ApplicationStageService applicationStageService;
    private final UtilisateurService utilisateurService;
    private final DocumentRepository documentRepository;

    @PostMapping("/{offreId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationStageDTO addApplicationStage(
            @PathVariable Long offreId,
            Authentication authentication
    ) throws BadRequestException, NotFoundException {

        Utilisateur utilisateur = utilisateurService
                .findEntityByEmail(authentication.getName());

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
}
