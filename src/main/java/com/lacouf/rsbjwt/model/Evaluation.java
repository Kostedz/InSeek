package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

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

    LocalDateTime evaluationDate;

    Disciplines discipline;

    @ManyToOne
    @JoinColumn(name = "internship_offer_id_id")
    OffreDeStage internshipOfferId;

    String evaluationComment;

    private static final double MAXIMUM_RATING = 5.0;

    private static double MINIMUM_RATING = 1.0;

}
