package com.lacouf.rsbjwt.model;

import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class CV extends Document {
    private String nom;

    @Builder
    public CV(Long id, String fileName, Disciplines targetDiscipline, byte[] data, String contentType, long size, String nom, String email) {
        super(id, fileName, targetDiscipline, data, email, contentType, size, StatutValidation.EN_ATTENTE, null);
        this.nom = nom;
    }
}