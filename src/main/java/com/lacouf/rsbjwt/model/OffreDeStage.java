package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OffreDeStage extends Document{
    private String nomEntreprise;
    private String position;
    private String descriptionPosition;
    private LocalDate dateDebutStage;
    private LocalDate dateFinStage;
    private String adresseEntreprise;
    private Double salaire;
    private String contactName;
    private String contactPhone;
    private int version = 1;
    private LocalDateTime updatedAt;
    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Utilisateur employeur;
    //private Etudiant edtudiant // Au cas ou on veut envoyer une offre a un etuuant specifique

    @Builder
    public OffreDeStage(Long id, String fileName, Disciplines targetDiscipline,
                        byte[] data, String contentType, long size,
                        Utilisateur employeur,
                        String nomEntreprise,
                        String position, String descriptionPosition,
                        LocalDate dateDebutStage, LocalDate dateFinStage, String adresseEntreprise, Double salaire,
                        String contactName, String contactPhone) {

        super(id, fileName, targetDiscipline, employeur, data, contentType, size, StatutValidation.EN_ATTENTE, null);

        this.nomEntreprise = nomEntreprise == null || nomEntreprise.isBlank()
                ? employeur instanceof Employeur employer ? employer.getNomCompagnie() : employeur.getNom()
                : nomEntreprise;
        this.position = position;
        this.descriptionPosition = descriptionPosition;
        this.dateDebutStage = dateDebutStage;
        this.dateFinStage = dateFinStage;
        this.adresseEntreprise = adresseEntreprise;
        this.salaire = salaire;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.updatedAt = LocalDateTime.now();
    }

}