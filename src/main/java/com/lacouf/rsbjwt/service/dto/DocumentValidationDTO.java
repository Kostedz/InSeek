package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.StatutValidation;

public record DocumentValidationDTO(
        Long id,
        String fileName,
        UtilisateurDTO utilisateur,
        StatutValidation statut,
        String commentaireRejet
) {
    public static DocumentValidationDTO of(Document document) {
        return new DocumentValidationDTO(
                document.getId(),
                document.getFileName(),
                UtilisateurDTO.of(document.getUtilisateur()),
                document.getStatut(),
                document.getCommentaireRejet()
        );
    }
}