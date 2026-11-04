package com.lacouf.rsbjwt.service.dto;

import lombok.Builder;

import java.time.LocalDate;

@Builder
public record PreRemplirContratDTO(
        String studentName,
        String fieldOfStudy,
        String companyName,
        String employerName,
        String offerTitle,
        String supervisorName,
        String assignedTeacherName,
        LocalDate internshipStartDate,
        LocalDate internshipEndDate,
        String schedule,
        double weeklyHours,
        Double hourlySalary,
        String location
) {
}
