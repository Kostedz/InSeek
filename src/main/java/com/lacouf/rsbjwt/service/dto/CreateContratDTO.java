package com.lacouf.rsbjwt.service.dto;

import java.time.LocalDate;

public record CreateContratDTO(
        Long studentId,
        Long offerId,
        LocalDate internshipStartingDate,
        LocalDate internshipEndingDate,
        String schedule,
        double weeklyHours,
        Double hourlySalary,
        String internshipLocation
) {}
