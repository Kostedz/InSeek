package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.StatutValidation;

import java.time.LocalDate;

public record ApplicationStageDTO(
        Long id,
        LocalDate dateApplique,
        EtudiantDTO etudiantDTO,
        OffreDeStageDTO offreDeStageDTO,
        StatutValidation statutValidation) {
}
