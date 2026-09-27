package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutValidation;

import java.time.LocalDate;

public record OffreDeStageDTO(
        Long id,
        String fileName,
        String email,
        String nomEntreprise,
        String position,
        String descriptionPosition,
        LocalDate dateDebutStage,
        LocalDate dateFinStage,
        String adresseEntreprise,
        StatutValidation statut,
        String commentaireRejet) implements DocumentDTO {


    public static OffreDeStageDTO of(OffreDeStage offre) {
        return new OffreDeStageDTO(
                offre.getId(),
                offre.getFileName(),
                offre.getEmail(),
                offre.getNomEntreprise(),
                offre.getPosition(),
                offre.getDescriptionPosition(),
                offre.getDateDebutStage(),
                offre.getDateFinStage(),
                offre.getAdresseEntreprise(),
                offre.getStatut(),
                offre.getCommentaireRejet()
        );
    }


}
