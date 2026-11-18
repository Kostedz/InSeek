package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Notification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        String titre,
        String message,
        String lienDirect,
        LocalDateTime createdAt
) {
    public static NotificationDTO of(Notification n) {
        return new NotificationDTO(n.getId(), n.getTitre(), n.getMe(), n.getLienDirect(), n.getCreatedAt());
    }
}