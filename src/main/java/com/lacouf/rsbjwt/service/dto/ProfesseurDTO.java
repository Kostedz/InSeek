package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Professeur;

public record ProfesseurDTO(Long id, String nom, String prenom, String email, String role, Disciplines discipline) implements UtilisateurDTO{
    public static ProfesseurDTO of(Professeur professeur){
        return new ProfesseurDTO(professeur.getId(), professeur.getNom(), professeur.getPrenom(), professeur.getEmail(), professeur.getRole(), professeur.getDiscipline());
    }

}