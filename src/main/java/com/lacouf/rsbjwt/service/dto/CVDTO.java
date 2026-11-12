package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.document.CV;
import com.lacouf.rsbjwt.model.utilisateur.Disciplines;

public record CVDTO(String email, Disciplines targetDiscipline) implements DocumentDTO {
    public static CVDTO of(CV cv) {
        return new CVDTO(cv.getUtilisateur().getEmail(), cv.getTargetDiscipline());
    }
}
