package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.ModeEntrevue;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record EntrevueDTO(
        Long id,
        Long employerId,
        Long studentId,
        Long offerId,
        LocalDateTime DateAndTime,
        ModeEntrevue mode,
        String locationOrLink,
        String message
) {
}
