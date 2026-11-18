package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;

import java.time.LocalDate;

public record PrefillStudentEvaluationDTO(
        Long employerId,
        String supervisorName,
        String companyName,
        Long studentId,
        String studentName,
        Long internshipOfferId,
        String offerTitle,
        Long contractId,
        LocalDate contractStartDate,
        LocalDate contractEndDate,
        Disciplines discipline
) {
}
