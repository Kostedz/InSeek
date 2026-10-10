package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.ModeEntrevue;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public class EntrevueDTO {
    private Long id;
    private Long employerId;
    private Long studentId;
    private Long offerId;
    private LocalDateTime DateAndTime;
    private ModeEntrevue mode;
    private String locationOrLink;
    private String message;
}
