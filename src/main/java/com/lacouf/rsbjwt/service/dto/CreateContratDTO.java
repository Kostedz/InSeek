package com.lacouf.rsbjwt.service.dto;

import java.time.LocalDate;

public record CreateContratDTO(
        Long studentId,
        LocalDate internshipStartingDate,
        LocalDate internshipEndingDate,
        double weeklyHours,
        Double hourlySalary,
        String internshipLocation
) {}
