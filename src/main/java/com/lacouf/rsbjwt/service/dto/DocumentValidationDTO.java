package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.StatutValidation;

public record DocumentValidationDTO(
        Long id,
        String fileName,
        String email,
        StatutValidation statut,
        String commentaireRejet
) {
    public static DocumentValidationDTO of(Document document) {
        return new DocumentValidationDTO(
                document.getId(),
                document.getFileName(),
                document.getUtilisateur().getEmail(),
                document.getStatut(),
                document.getCommentaireRejet()
        );
    }
}