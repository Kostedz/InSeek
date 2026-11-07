package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
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
        LocalDate evaluationDate,
        Disciplines discipline,
        Long internshipOfferId,
        String evaluationComment
) implements EvaluationDTO {

    public static StudentEvaluationDTO of(StudentEvaluation evaluation) {
        return new StudentEvaluationDTO(
                evaluation.getEvaluationId(),
                evaluation.getEmployer().getId(),
                evaluation.getIntern().getId(),
                evaluation.getProfessionalismRating(),
                evaluation.getWorkQualityRating(),
                evaluation.getTeamworkRating(),
                evaluation.getCommunicationRating(),
                evaluation.getObjectiveReachedRating(),
                evaluation.getEvaluationDate(),
                evaluation.getDiscipline(),
                evaluation.getInternshipOffer().getId(),
                evaluation.getEvaluationComment()
        );
    }
}