package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.Professeur;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class CompanyEvaluation extends Evaluation {

    @ManyToOne
    private Professeur teacher;

    @ManyToOne
    private Employeur employerCompany;

    @ManyToOne
    private Etudiant studentIntern;

    @ManyToOne
    private Contract contract;

    private LocalDate visitDate;

    private double supervisionRating;

    private double taskComplianceRating;

    private double workEnvironmentRating;


}
