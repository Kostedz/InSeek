package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CompanyEvaluation;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.EvaluationState;

import java.time.LocalDate;

public record CompanyEvaluationDTO(
        Long evaluationId,
        Long studentId,
        Long contractId,
        Long internshipOfferId,

        double supervisionRating,
        double taskComplianceRating,
        double workEnvironmentRating,
        LocalDate visitDate,
        Disciplines discipline,
        String evaluationComment,
        EvaluationState evaluationState,
        LocalDate evaluationSubmittedAt
) implements EvaluationDTO {

    public static CompanyEvaluationDTO of(CompanyEvaluation evaluation) {

        return new CompanyEvaluationDTO(
                evaluation.getEvaluationId(),
                evaluation.getStudentIntern() != null ? evaluation.getStudentIntern().getId() : null,
                evaluation.getContract() != null ? evaluation.getContract().getId() : null,
                evaluation.getInternshipOffer() != null ? evaluation.getInternshipOffer().getId() : null,
                evaluation.getSupervisionRating(),
                evaluation.getTaskComplianceRating(),
                evaluation.getWorkEnvironmentRating(),
                evaluation.getVisitDate(),
                evaluation.getDiscipline(),
                evaluation.getEvaluationComment(),
                evaluation.getEvaluationState(),
                evaluation.getEvaluationSubmittedDate()
        );
    }
}