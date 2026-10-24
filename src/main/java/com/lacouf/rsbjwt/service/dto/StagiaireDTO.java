package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.StatutRechercheEtudiant;

public record StagiaireDTO(
        Long id,
        String nom,
        String prenom,
        String email,
        Disciplines discipline,
        StatutRechercheEtudiant statutRecherche,
        Long professeurId,
        String professeurNom,
        String professeurPrenom
) {
    public static StagiaireDTO of(Etudiant etudiant) {
        Professeur professeur = etudiant.getProfesseur();
        return new StagiaireDTO(
                etudiant.getId(),
                etudiant.getNom(),
                etudiant.getPrenom(),
                etudiant.getEmail(),
                etudiant.getDiscipline(),
                etudiant.getStatutRecherche(),
                professeur == null ? null : professeur.getId(),
                professeur == null ? null : professeur.getNom(),
                professeur == null ? null : professeur.getPrenom()
        );
    }
}