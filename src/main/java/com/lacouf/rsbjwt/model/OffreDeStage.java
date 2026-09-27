package com.lacouf.rsbjwt.model;

import jakarta.persistence.Entity;
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

    @Builder
    public OffreDeStage(Long id, String fileName, Disciplines targetDiscipline,
                        byte[] data, String contentType, long size,
                        String email,
                        String nomEntreprise,
                        String position, String descriptionPosition,
                        LocalDate dateDebutStage, LocalDate dateFinStage, String adresseEntreprise) {

        super(id, fileName, targetDiscipline, data, email, contentType, size,
                StatutValidation.EN_ATTENTE, null);

        this.nomEntreprise = nomEntreprise;
        this.position = position;
        this.descriptionPosition = descriptionPosition;
        this.dateDebutStage = dateDebutStage;
        this.dateFinStage = dateFinStage;
        this.adresseEntreprise = adresseEntreprise;
    }

}
