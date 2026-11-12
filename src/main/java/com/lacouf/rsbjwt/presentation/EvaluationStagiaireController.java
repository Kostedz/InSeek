package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.EvaluationStagiaireService;
import com.lacouf.rsbjwt.service.dto.EvaluationStagiaireDTO;
import com.lacouf.rsbjwt.service.dto.SoumettreEvaluationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/evaluations")
@RequiredArgsConstructor
public class EvaluationStagiaireController {

    private final EvaluationStagiaireService evaluationService;

    @PostMapping("/contracts/{contratId}")
    @PreAuthorize("hasAuthority('EMPLOYEUR')")
    public ResponseEntity<Map<String, Long>> soumettre(@PathVariable Long contratId,
                                                       @RequestBody SoumettreEvaluationDTO dto,
                                                       Principal principal)
            throws NotFoundException, BadRequestException, ConflictException {
        Long id = evaluationService.soumettre(contratId, dto.commentaire(), principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @GetMapping("/contracts/{contratId}")
    @PreAuthorize("hasAuthority('PROFESSEUR')")
    public ResponseEntity<EvaluationStagiaireDTO> consulter(@PathVariable Long contratId,
                                                            Principal principal)
            throws NotFoundException {
        return ResponseEntity.ok(evaluationService.consulterPourProfesseur(contratId, principal.getName()));
    }
}