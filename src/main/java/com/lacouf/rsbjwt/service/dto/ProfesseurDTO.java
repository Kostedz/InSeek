package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.auth.Role;
import lombok.Builder;

public record ProfesseurDTO(Long id, String nom, String prenom, String email, String role, Disciplines discipline) implements UtilisateurDTO{
    public static ProfesseurDTO of(com.lacouf.rsbjwt.model.Professeur professeur){
        return new ProfesseurDTO(professeur.getId(), professeur.getNom(), professeur.getPrenom(), professeur.getEmail(), professeur.getRole(), professeur.getDiscipline());
    }

}
/*
public class ProfesseurDTO extends UserDTO{
    private Disciplines discipline;

    @Builder
    public ProfesseurDTO(Long id, String firstName, String lastname, String email, Role role, Disciplines discipline) {
        super(id, firstName, lastname, email, role);
        this.discipline = discipline;
    }

    public ProfesseurDTO() {}

    public static ProfesseurDTO create(Professeur professeur) {
        return ProfesseurDTO.builder()
                .id(professeur.getId())
                .firstName(professeur.getFirstName())
                .lastname(professeur.getLastName())
                .email(professeur.getEmail())
                .role(professeur.getRole())
                .discipline(professeur.getDiscipline())
                .build();
    }

    public static ProfesseurDTO empty() {
        return new ProfesseurDTO();
    }

} */