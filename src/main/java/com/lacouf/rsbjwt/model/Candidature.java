package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "etudiant_id")
    private Etudiant etudiant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "offre_id")
    private OffreDeStage offre;

    @Enumerated(EnumType.STRING)
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    private String commentaireRefus;
    private LocalDateTime dateCandidature = LocalDateTime.now();
    private LocalDateTime dateEntrevue;
    private LocalDateTime dateDecision;

    @Builder
    public Candidature(Long id, Etudiant etudiant, OffreDeStage offre,
                       StatutCandidature statut, LocalDateTime dateCandidature,
                       LocalDateTime dateEntrevue) {
        this.id = id;
        this.etudiant = etudiant;
        this.offre = offre;
        this.statut = statut == null ? StatutCandidature.EN_ATTENTE : statut;
        this.dateCandidature = dateCandidature == null ? LocalDateTime.now() : dateCandidature;
        this.dateEntrevue = dateEntrevue;
    }
}