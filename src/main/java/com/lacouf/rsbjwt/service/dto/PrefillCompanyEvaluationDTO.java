package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;

import java.time.LocalDate;

public record PrefillCompanyEvaluationDTO(
        Long teacherId,
        String teacherName,
        Long studentId,
        String studentName,
        Long employerCompanyId,
        String companyName,
        String supervisorName,
        Long internshipOfferId,
        String offerTitle,
        Long contractId,
        LocalDate contractStartDate,
        LocalDate contractEndDate,
        Disciplines discipline
)
{
}
