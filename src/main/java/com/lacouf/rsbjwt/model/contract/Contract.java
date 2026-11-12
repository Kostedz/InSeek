package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.Gestionnaire;
import com.lacouf.rsbjwt.model.utilisateur.Professeur;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract extends Document {

    @ManyToOne()
    private Etudiant student;

    @ManyToOne()
    private Employeur employer;

    @ManyToOne()
    private OffreDeStage internshipOffer;

    @ManyToOne()
    private Gestionnaire admin;

    @ManyToOne
    private Professeur teacher;

    private String supervisorName;

    private LocalDate startingDate;

    private LocalDate endingDate;

    private String schedule;

    private double weeklyHours;

    private Double hourlySalary;

    private String internshipLocation;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutContrat contractStatus = StatutContrat.PENDING_SIGNATURE;

    private LocalDateTime studentSignedAt;

    private LocalDateTime employerSignedAt;

    private LocalDateTime managerSignedAt;

    private LocalDateTime dateCreation = LocalDateTime.now();

}
