package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Disciplines;

public record CVDTO(String email, Disciplines targetDiscipline) implements DocumentDTO {
    public static CVDTO of(CV cv) {
        return new CVDTO(cv.getUtilisateur().getEmail(), cv.getTargetDiscipline());
    }
}
