package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Professeur;
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

    private static final double MAXIMUM_RATING = 5.0;

    private static double MINIMUM_RATING = 1.0;

    private double supervisionRating;

    private double taskComplianceRating;

    private double workEnvironmentRating;


}
