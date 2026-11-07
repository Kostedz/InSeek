package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.OffreDeStage;

import java.time.LocalDate;

public interface EvaluationDTO {
    LocalDate evaluationDate();
    Disciplines discipline();
    Long internshipOfferId();
    String evaluationComment();
}
