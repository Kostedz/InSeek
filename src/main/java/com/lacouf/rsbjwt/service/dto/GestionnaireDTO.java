package com.lacouf.rsbjwt.service.dto;

public record GestionnaireDTO(Long id, String nom, String prenom, String email, String role) {
    public static GestionnaireDTO of(com.lacouf.rsbjwt.model.Gestionnaire gestionnaire) {
        return new GestionnaireDTO(gestionnaire.getId(), gestionnaire.getNom(), gestionnaire.getPrenom(), gestionnaire.getEmail(), gestionnaire.getRole());
    }
}
