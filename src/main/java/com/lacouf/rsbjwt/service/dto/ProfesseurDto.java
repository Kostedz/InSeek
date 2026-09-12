package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.auth.Role;
import lombok.Builder;

public class ProfesseurDto extends UserDTO{
    private Disciplines discipline;

    @Builder
    public ProfesseurDto(Long id, String firstName, String lastname, String email, Role role, Disciplines discipline) {
        super(id, firstName, lastname, email, role);
        this.discipline = discipline;
    }

    public ProfesseurDto() {}

    public static ProfesseurDto create(Professeur professeur) {
        return ProfesseurDto.builder()
                .id(professeur.getId())
                .firstName(professeur.getFirstName())
                .lastname(professeur.getLastName())
                .email(professeur.getEmail())
                .role(professeur.getRole())
                .discipline(professeur.getDiscipline())
                .build();
    }

    public static ProfesseurDto empty() {
        return new ProfesseurDto();
    }

}
