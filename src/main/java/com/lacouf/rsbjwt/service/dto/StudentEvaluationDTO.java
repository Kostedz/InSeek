package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.EvaluationState;
import com.lacouf.rsbjwt.model.StudentEvaluation;

import java.time.LocalDate;

public record StudentEvaluationDTO(
        Long evaluationId,
        Long employerId,
        Long internId,
        double professionalismRating,
        double workQualityRating,
        double teamworkRating,
        double communicationRating,
        double objectiveReachedRating,
        LocalDate evaluationSubmittedDate,
        Disciplines discipline,
        Long internshipOfferId,
        String evaluationComment,
        EvaluationState evaluationState
) implements EvaluationDTO {

    public static StudentEvaluationDTO of(StudentEvaluation evaluation) {
        return new StudentEvaluationDTO(
                evaluation.getEvaluationId(),
                evaluation.getEmployer() != null ? evaluation.getEmployer().getId() : null,
                evaluation.getIntern() != null ? evaluation.getIntern().getId() : null,
                evaluation.getProfessionalismRating(),
                evaluation.getWorkQualityRating(),
                evaluation.getTeamworkRating(),
                evaluation.getCommunicationRating(),
                evaluation.getObjectiveReachedRating(),
                evaluation.getEvaluationSubmittedDate(),
                evaluation.getDiscipline(),
                evaluation.getInternshipOffer() != null ? evaluation.getInternshipOffer().getId() : null,
                evaluation.getEvaluationComment(),
                evaluation.getEvaluationState()
        );
    }
}