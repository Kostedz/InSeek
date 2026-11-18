package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.entrevue.StatutConvocationEntrevue;

public record RepondreConvocationDTO(StatutConvocationEntrevue interviewInvitationStatus, String messageWhenRejected) {
}
