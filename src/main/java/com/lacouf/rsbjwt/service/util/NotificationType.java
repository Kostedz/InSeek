package com.lacouf.rsbjwt.service.util;

import lombok.Getter;

@Getter
public enum NotificationType {
    // Gestionnaire
    CV_TO_APPROVE("CV en attente de validation.");
    // Etudiant
    // Employeur
    // Professeur

    private final String message;

    NotificationType(String s) {
        this.message = s;
    }
}
