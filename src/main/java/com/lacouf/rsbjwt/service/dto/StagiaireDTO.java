package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.Contract;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.StatutContrat;
import com.lacouf.rsbjwt.model.StatutRechercheEtudiant;
import com.lacouf.rsbjwt.model.StatutValidation;

import java.util.Comparator;

public record StagiaireDTO(
        Long id,
        String nom,
        String prenom,
        String email,
        Disciplines discipline,
        StatutRechercheEtudiant statutRecherche,
        Long professeurId,
        String professeurNom,
        String professeurPrenom,
        String entrepriseAccueil,
        String tuteurEntreprise
) {
    public StagiaireDTO(Long id, String nom, String prenom, String email, Disciplines discipline,
                        StatutRechercheEtudiant statutRecherche, Long professeurId,
                        String professeurNom, String professeurPrenom) {
        this(id, nom, prenom, email, discipline, statutRecherche, professeurId,
                professeurNom, professeurPrenom, null, null);
    }

    public static StagiaireDTO of(Etudiant etudiant) {
        Professeur professeur = etudiant.getProfesseur();
        ApplicationStage acceptedApplication = etudiant.getCandidatures().stream()
                .filter(candidature -> candidature.getStatutValidation() == StatutValidation.ACCEPTE)
                .max(Comparator.comparing(ApplicationStage::getDateDecision,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
        Contract signedContract = etudiant.getContrats().stream()
                .filter(contract -> contract.getContractStatus() != null
                        && contract.getContractStatus() != StatutContrat.PENDING_SIGNATURE
                        && contract.getContractStatus() != StatutContrat.REFUSED)
                .max(Comparator.comparing(Contract::getDateCreation,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
        String entrepriseAccueil = acceptedApplication != null && acceptedApplication.getOffreDeStage() != null
                ? acceptedApplication.getOffreDeStage().getNomEntreprise()
                : signedContract != null && signedContract.getInternshipOffer() != null
                ? signedContract.getInternshipOffer().getNomEntreprise()
                : null;
        String tuteurEntreprise = signedContract != null && signedContract.getSupervisorName() != null
                && !signedContract.getSupervisorName().isBlank()
                ? signedContract.getSupervisorName()
                : acceptedApplication != null && acceptedApplication.getOffreDeStage() != null
                ? acceptedApplication.getOffreDeStage().getContactName()
                : null;
        return new StagiaireDTO(
                etudiant.getId(),
                etudiant.getNom(),
                etudiant.getPrenom(),
                etudiant.getEmail(),
                etudiant.getDiscipline(),
                etudiant.getStatutRecherche(),
                professeur == null ? null : professeur.getId(),
                professeur == null ? null : professeur.getNom(),
                professeur == null ? null : professeur.getPrenom(),
                entrepriseAccueil,
                tuteurEntreprise
        );
    }
}
