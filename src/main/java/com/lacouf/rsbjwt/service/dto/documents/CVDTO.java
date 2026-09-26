package com.lacouf.rsbjwt.service.dto.documents;

public record CVDTO(String email, String nom) implements DocumentDTO {
    public static CVDTO of(String email, String nom) {
        return new CVDTO(email, nom);
    }
}
