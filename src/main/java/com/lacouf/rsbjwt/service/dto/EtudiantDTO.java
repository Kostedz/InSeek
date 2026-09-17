package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;

public record EtudiantDTO(Long id, String nom, String prenom, String email, String role, Disciplines discipline) implements UtilisateurDTO {

    public static EtudiantDTO of(com.lacouf.rsbjwt.model.Etudiant etudiant) {
        return new EtudiantDTO(etudiant.getId(), etudiant.getNom(), etudiant.getPrenom(), etudiant.getEmail(), etudiant.getRole(), etudiant.getDiscipline());
    }
}
