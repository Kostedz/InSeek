package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
import com.lacouf.rsbjwt.model.document.OffreDeStage;

import java.time.LocalDate;

public interface EvaluationDTO {
    Disciplines discipline();
    Long internshipOfferId();
    String evaluationComment();
}
