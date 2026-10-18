package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
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
        String message,
        StatutConvocationEntrevue interviewInvitationStatus,
        LocalDateTime invitationResponseDate,
        String messageWhenRejected
) {
    public static EntrevueDTO of(Entrevue interview) {
        return new EntrevueDTO(
                interview.getId(),
                interview.getEmployer().getId(),
                interview.getStudent().getId(),
                interview.getInternshipOffer().getId(),
                interview.getDateInterview(),
                interview.getModeInterview(),
                interview.getLocationOrLink(),
                interview.getMessage(),
                interview.getInterviewInvitationStatus(),
                interview.getInvitationResponseDate(),
                interview.getMessageWhenRejected()
        );
    }
}
