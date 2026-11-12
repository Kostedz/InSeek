package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    Disciplines discipline;

    @ManyToOne
    @JoinColumn(name = "internship_offer_id")
    OffreDeStage internshipOffer;

    String evaluationComment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationState evaluationState = EvaluationState.DRAFT;

    private LocalDate evaluationSubmittedDate;

    private static final double MAXIMUM_RATING = 5.0;

    private static double MINIMUM_RATING = 1.0;

}
