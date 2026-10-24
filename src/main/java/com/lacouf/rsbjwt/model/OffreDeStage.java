package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.service.util.OfferFields;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.coyote.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OffreDeStage extends Document {
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

    public static OffreDeStage create(MultipartFile file, OfferFields fields, Utilisateur uploader) throws IOException {
        return OffreDeStage.builder()
                .fileName(file.getOriginalFilename())
                .targetDiscipline(fields.getTargetDiscipline())
                .data(file.getBytes())
                .contentType(file.getContentType())
                .size(file.getSize())
                .employeur(uploader)
                .nomEntreprise(fields.getNomEntreprise())
                .position(fields.getPosition())
                .descriptionPosition(fields.getDescriptionPosition())
                .dateDebutStage(fields.getDateDebutStage())
                .dateFinStage(fields.getDateFinStage())
                .adresseEntreprise(fields.getAdresseEntreprise())
                .salaire(fields.getSalaire())
                .contactName(fields.getContactName())
                .contactPhone(fields.getContactPhone())
                .build();
    }

    public void updateFields(OfferFields fields) throws IOException {
        if (fields.getNomEntreprise() != null && !fields.getNomEntreprise().isBlank()) {
            this.nomEntreprise = fields.getNomEntreprise();
        }
        if (fields.getPosition() != null && !fields.getPosition().isBlank()) {
            this.position = fields.getPosition();
        }
        if (fields.getDescriptionPosition() != null && !fields.getDescriptionPosition().isBlank()) {
            this.descriptionPosition = fields.getDescriptionPosition();
        }
        if (fields.getDateDebutStage() != null) {
            this.dateDebutStage = fields.getDateDebutStage();
        }
        if (fields.getDateFinStage() != null) {
            this.dateFinStage = fields.getDateFinStage();
        }
        if (fields.getAdresseEntreprise() != null && !fields.getAdresseEntreprise().isBlank()) {
            this.adresseEntreprise = fields.getAdresseEntreprise();
        }
        if (fields.getSalaire() != null) {
            this.salaire = fields.getSalaire();
        }
        if (fields.getContactName() != null && !fields.getContactName().isBlank()) {
            this.contactName = fields.getContactName();
        }
        if (fields.getContactPhone() != null && !fields.getContactPhone().isBlank()) {
            this.contactPhone = fields.getContactPhone();
        }
        this.setTargetDiscipline(fields.getTargetDiscipline());

        this.setStatut(StatutValidation.EN_ATTENTE);
        this.version++;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateFile(MultipartFile file) throws IOException {
        this.setFileName(file.getOriginalFilename());
        this.setData(file.getBytes());
        this.setContentType(file.getContentType());
        this.setSize(file.getSize());
    }
}
