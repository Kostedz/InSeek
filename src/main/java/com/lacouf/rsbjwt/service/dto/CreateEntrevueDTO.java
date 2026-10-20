package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.ModeEntrevue;

import java.time.LocalDateTime;

public record CreateEntrevueDTO(
        Long studentId,
        Long offerId,
        LocalDateTime DateAndTime,
        ModeEntrevue mode,
        String locationOrLink,
        String message
) {}
