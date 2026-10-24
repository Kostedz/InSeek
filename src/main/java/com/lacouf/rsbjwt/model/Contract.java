package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contractId;

    @OneToOne()
    private Etudiant student;

    @OneToOne()
    private Employeur employee;

    @OneToOne()
    private OffreDeStage internshipOffer;

    private Gestionnaire admin;

    //@OneToOne
    //private Professeur teacher;

    private String supervisorName;

    private LocalDate startingDate;

    private LocalDate endingDate;

    private double weeklyHours;

    private Double hourlySalary;

    private String internshipLocation;

    @Enumerated(EnumType.STRING)
    private StatutContrat contractStatus = StatutContrat.PENDING_SIGNATURE;

    private LocalDateTime dateCreation = LocalDateTime.now();

}
