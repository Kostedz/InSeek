package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"etudiant_id", "offre_de_stage_id"}
        )
)
public class ApplicationStage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private LocalDate dateApplique = LocalDate.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id")
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_de_stage_id")
    private OffreDeStage offreDeStage;

    @Enumerated(EnumType.STRING)
    private StatutValidation statutValidation = StatutValidation.EN_ATTENTE;

    @Column(length = 1000)
    private String commentaireRefus;

    private LocalDateTime dateDecision;
}
