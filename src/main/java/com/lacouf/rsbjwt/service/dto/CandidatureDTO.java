package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Candidature;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutCandidature;

import java.time.LocalDateTime;

public record CandidatureDTO(
        Long id,
        StatutCandidature statut,
        String commentaireRefus,
        LocalDateTime dateCandidature,
        LocalDateTime dateEntrevue,
        String etatEntrevue,
        LocalDateTime dateDecision,
        // étudiant
        Long etudiantId,
        String etudiantNom,
        String etudiantPrenom,
        String etudiantEmail,
        Disciplines etudiantDiscipline,
        // offre
        Long offreId,
        String offrePosition,
        String offreNomEntreprise,
        // CV de l'étudiant (null si aucun CV)
        Long cvId
) {
    public static CandidatureDTO of(Candidature c, Long cvId) {
        Etudiant e = c.getEtudiant();
        OffreDeStage o = c.getOffre();
        return new CandidatureDTO(
                c.getId(),
                c.getStatut(),
                c.getCommentaireRefus(),
                c.getDateCandidature(),
                c.getDateEntrevue(),
                etatEntrevue(c.getDateEntrevue()),
                c.getDateDecision(),
                e.getId(),
                e.getNom(),
                e.getPrenom(),
                e.getEmail(),
                e.getDiscipline(),
                o.getId(),
                o.getPosition(),
                o.getNomEntreprise(),
                cvId
        );
    }

    private static String etatEntrevue(LocalDateTime date) {
        if (date == null) return "AUCUNE";
        return date.isAfter(LocalDateTime.now()) ? "PLANIFIEE" : "PASSEE";
    }
}