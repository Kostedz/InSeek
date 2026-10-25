package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.SuiviEtudiantsService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/professeur")
public class SuiviEtudiantsController {

    private final SuiviEtudiantsService suiviEtudiantsService;

    @GetMapping("/etudiants")
    public ResponseEntity<List<StagiaireDTO>> listEtudiants(Principal principal) {
        return ResponseEntity.ok(suiviEtudiantsService.listEtudiantsDuProfesseur(principal.getName()));
    }

    @GetMapping("/etudiants/{etudiantId}/demandes")
    public ResponseEntity<List<ApplicationStageDTO>> listDemandes(Principal principal,
                                                                  @PathVariable Long etudiantId)
            throws NotFoundException, BadRequestException {
        return ResponseEntity.ok(suiviEtudiantsService.listDemandesDeStage(principal.getName(), etudiantId));
    }
}