package com.lacouf.rsbjwt.model;

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
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contractId;

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

    private double weeklyHours;

    private Double hourlySalary;

    private String internshipLocation;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutContrat contractStatus = StatutContrat.PENDING_SIGNATURE;

    private LocalDateTime dateCreation = LocalDateTime.now();

}
