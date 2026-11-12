package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
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

}
