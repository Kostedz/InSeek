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

    @Builder
    public CV(Long id, String fileName, Disciplines targetDiscipline, byte[] data, String contentType, long size, Utilisateur utilisateur) {
        super(id, fileName, targetDiscipline, utilisateur, data, contentType, size, StatutValidation.EN_ATTENTE, null);
    }
}
