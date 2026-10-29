package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;

public record EtudiantEligibleContratDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        Disciplines fieldOfStudy,
        boolean hasContract,
        Long offerId,
        String offerTitle,
        String companyName
) {
    public static EtudiantEligibleContratDTO of(Etudiant etudiant, boolean hasContract, Long offerId,String offerTitle, String companyName){
        return new EtudiantEligibleContratDTO(
                etudiant.getId(),
                etudiant.getPrenom(),
                etudiant.getNom(),
                etudiant.getEmail(),
                etudiant.getDiscipline(),
                hasContract,
                offerId,
                offerTitle,
                companyName
        );
    }
}
