package com.lacouf.rsbjwt.model;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class CompanyEvaluation extends Evaluation {

    @ManyToOne
    private Professeur professeur;

    @ManyToOne
    private Employeur employerCompany;

    private double supervisionRating;

    private double taskComplianceRating;

    private double workEnvironmentRating;


}
