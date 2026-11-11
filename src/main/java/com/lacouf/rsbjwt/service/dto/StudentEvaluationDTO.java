package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.EvaluationState;
import com.lacouf.rsbjwt.model.StudentEvaluation;

import java.time.LocalDate;

public record StudentEvaluationDTO(
        Long evaluationId,
        Long employerId,
        Long internId,
        Long contractId,
        Long internshipOfferId,
        double professionalismRating,
        double workQualityRating,
        double teamworkRating,
        double communicationRating,
        double objectiveReachedRating,
        Disciplines discipline,
        String evaluationComment,
        EvaluationState evaluationState,
        LocalDate evaluationSubmittedAt
) implements EvaluationDTO {

    public static StudentEvaluationDTO of(StudentEvaluation evaluation) {

        return new StudentEvaluationDTO(
                evaluation.getEvaluationId(),
                evaluation.getEmployer() != null ? evaluation.getEmployer().getId() : null,
                evaluation.getIntern() != null ? evaluation.getIntern().getId() : null,
                evaluation.getContract() != null ? evaluation.getContract().getId() : null,
                evaluation.getInternshipOffer() != null ? evaluation.getInternshipOffer().getId() : null,
                evaluation.getProfessionalismRating(),
                evaluation.getWorkQualityRating(),
                evaluation.getTeamworkRating(),
                evaluation.getCommunicationRating(),
                evaluation.getObjectiveReachedRating(),
                evaluation.getDiscipline(),
                evaluation.getEvaluationComment(),
                evaluation.getEvaluationState(),
                evaluation.getEvaluationSubmittedDate()
        );
    }
}