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
public class StudentEvaluation extends Evaluation{

    @ManyToOne
    Employeur employer;

    @ManyToOne
    Etudiant intern;

    @ManyToOne
    private Contract contract;

    private double professionalismRating;
    private double workQualityRating;
    private double teamworkRating;
    private double communicationRating;
    private double objectiveReachedRating;
}