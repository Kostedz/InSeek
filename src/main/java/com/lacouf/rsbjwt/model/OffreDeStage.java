package com.lacouf.rsbjwt.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

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
    private Double salaire; // Ajout
    @ManyToOne // Ajout
    @JoinColumn(name = "employeur_id") // Ajout
    private Employeur employeur; // Ajout
    //private Etudiant edtudiant // Au cas ou on veut envoyer une offre a un etuuant specifique

    @Builder
    public OffreDeStage(Long id, String fileName, Disciplines targetDiscipline,
                        byte[] data, String contentType, long size,
                        Employeur employeur,
                        String position, String descriptionPosition,
                        LocalDate dateDebutStage, LocalDate dateFinStage, String adresseEntreprise,Double salaire) {

        super(id, fileName, targetDiscipline, employeur, data, contentType, size, StatutValidation.EN_ATTENTE, null);

        this.nomEntreprise = employeur.getNomCompagnie();
        this.position = position;
        this.descriptionPosition = descriptionPosition;
        this.dateDebutStage = dateDebutStage;
        this.dateFinStage = dateFinStage;
        this.adresseEntreprise = adresseEntreprise;
        this.salaire = salaire;
    }

}
