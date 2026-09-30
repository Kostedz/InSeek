package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;

public record CVDTO(String email) implements DocumentDTO {
    public static CVDTO of(CV cv) {
        return new CVDTO(cv.getUtilisateur().getEmail());
    }
}
