package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.utilisateur.Gestionnaire;

public record GestionnaireDTO(Long id, String nom, String prenom, String email, String role) implements UtilisateurDTO {
    public static GestionnaireDTO of(Gestionnaire gestionnaire) {
        return new GestionnaireDTO(gestionnaire.getId(), gestionnaire.getNom(), gestionnaire.getPrenom(), gestionnaire.getEmail(), gestionnaire.getRole());
    }
}