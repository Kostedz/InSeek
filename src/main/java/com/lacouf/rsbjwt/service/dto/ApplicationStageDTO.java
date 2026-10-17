package com.lacouf.rsbjwt.service.dto;

import java.time.LocalDate;

public record ApplicationStageDTO(Long id, LocalDate dateApplique, EtudiantDTO etudiantDTO, OffreDeStageDTO offreDeStageDTO) {
}
