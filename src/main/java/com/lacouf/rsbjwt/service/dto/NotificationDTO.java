package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.TypeNotification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        TypeNotification type,
        String message,
        Long contratId,
        boolean lue,
        LocalDateTime dateCreation
) {
    public static NotificationDTO of(Notification n) {
        return new NotificationDTO(
                n.getId(), n.getType(), n.getMessage(),
                n.getContrat() == null ? null : n.getContrat().getId(),
                n.isLue(), n.getDateCreation());
    }
}