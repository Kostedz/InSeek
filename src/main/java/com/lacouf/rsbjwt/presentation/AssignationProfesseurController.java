package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.AssignationProfesseurService;
import com.lacouf.rsbjwt.service.dto.AssignerProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/gestionnaire")
public class AssignationProfesseurController {

    private final AssignationProfesseurService assignationProfesseurService;

    @GetMapping("/stagiaires")
    public ResponseEntity<List<StagiaireDTO>> listStagiaires() {
        return ResponseEntity.ok(assignationProfesseurService.listStagiaires());
    }

    @GetMapping("/professeurs")
    public ResponseEntity<List<ProfesseurDTO>> listProfesseurs() {
        return ResponseEntity.ok(assignationProfesseurService.listProfesseurs());
    }

    @PutMapping("/stagiaires/{etudiantId}/professeur")
    public ResponseEntity<StagiaireDTO> assignerProfesseur(@PathVariable Long etudiantId,
                                                           @RequestBody AssignerProfesseurDTO dto)
            throws NotFoundException, BadRequestException {
        return ResponseEntity.ok(assignationProfesseurService.assignerProfesseur(etudiantId, dto.professeurId()));
    }
}