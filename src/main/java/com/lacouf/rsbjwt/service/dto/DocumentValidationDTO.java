package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutValidation;

import java.time.LocalDate;

public record DocumentValidationDTO(
        Long id,
        String fileName,
        String email,
        StatutValidation statut,
        String commentaireRejet,
        long size,
        String nomEntreprise,
        String position,
        String contactName,
        String contactPhone,
        LocalDate dateDebutStage,
        LocalDate dateFinStage,
        Disciplines targetDiscipline,
        String adresseEntreprise,
        String descriptionPosition
) {
    public static DocumentValidationDTO of(Document document) {
        OffreDeStage offer = document instanceof OffreDeStage ? (OffreDeStage) document : null;
        return new DocumentValidationDTO(
                document.getId(),
                document.getFileName(),
                document.getUtilisateur().getEmail(),
                document.getStatut(),
                document.getCommentaireRejet(),
                document.getSize(),
                offer == null ? null : offer.getNomEntreprise(),
                offer == null ? null : offer.getPosition(),
                offer == null ? null : offer.getContactName(),
                offer == null ? null : offer.getContactPhone(),
                offer == null ? null : offer.getDateDebutStage(),
                offer == null ? null : offer.getDateFinStage(),
                offer == null ? null : offer.getTargetDiscipline(),
                offer == null ? null : offer.getAdresseEntreprise(),
                offer == null ? null : offer.getDescriptionPosition()
        );
    }
}
