package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.StatutEnvoiCourriel;
import com.lacouf.rsbjwt.model.TypeNotification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        TypeNotification type,
        String message,
        String messageEn,
        Long contratId,
        String lien,
        boolean lue,
        StatutEnvoiCourriel statutCourriel,
        LocalDateTime dateEnvoi,
        LocalDateTime dateCreation
) {
    public static NotificationDTO of(Notification n) {
        return new NotificationDTO(
                n.getId(), n.getType(), n.getMessage(), n.getMessageEn(),
                n.getContrat() == null ? null : n.getContrat().getId(),
                n.getLien(), n.isLue(), n.getStatutCourriel(), n.getDateEnvoi(), n.getDateCreation());
    }
}