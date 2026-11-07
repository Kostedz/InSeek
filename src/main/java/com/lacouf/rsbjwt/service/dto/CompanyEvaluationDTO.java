package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CompanyEvaluation;
import com.lacouf.rsbjwt.model.Disciplines;

import java.time.LocalDate;

public record CompanyEvaluationDTO(
        Long evaluationId,
        Long professeurId,
        Long employerCompanyId,
        double supervisionRating,
        double taskComplianceRating,
        double workEnvironmentRating,
        LocalDate evaluationDate,
        Disciplines discipline,
        Long internshipOfferId,
        String evaluationComment
) implements EvaluationDTO {

    public static CompanyEvaluationDTO of(CompanyEvaluation evaluation) {
        return new CompanyEvaluationDTO(
                evaluation.getEvaluationId(),
                evaluation.getProfesseur().getId(),
                evaluation.getEmployerCompany().getId(),
                evaluation.getSupervisionRating(),
                evaluation.getTaskComplianceRating(),
                evaluation.getWorkEnvironmentRating(),
                evaluation.getEvaluationDate(),
                evaluation.getDiscipline(),
                evaluation.getInternshipOffer().getId(),
                evaluation.getEvaluationComment()
        );
    }
}