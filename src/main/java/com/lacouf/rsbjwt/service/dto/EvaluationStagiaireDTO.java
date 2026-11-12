package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.EvaluationStagiaire;

import java.time.LocalDateTime;

public record EvaluationStagiaireDTO(
        Long id,
        Long contratId,
        String etudiantNom,
        String entreprise,
        String commentaire,
        LocalDateTime dateSoumission) {

    public static EvaluationStagiaireDTO of(EvaluationStagiaire e) {
        var etudiant = e.getContrat().getStudent();
        return new EvaluationStagiaireDTO(
                e.getId(),
                e.getContrat().getId(),
                etudiant == null ? "" : (etudiant.getPrenom() + " " + etudiant.getNom()).trim(),
                e.getEmployeur().getNomCompagnie(),
                e.getCommentaire(),
                e.getDateSoumission());
    }
}