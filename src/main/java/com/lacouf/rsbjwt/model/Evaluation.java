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
@ToString
public abstract class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Long evaluationId;

    LocalDate evaluationDate;

    Disciplines discipline;

    @ManyToOne
    @JoinColumn(name = "internship_offer_id")
    OffreDeStage internshipOffer;

    String evaluationComment;

    private static final double MAXIMUM_RATING = 5.0;

    private static double MINIMUM_RATING = 1.0;

}
