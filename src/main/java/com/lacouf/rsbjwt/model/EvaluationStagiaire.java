package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class EvaluationStagiaire {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "contrat_id", unique = true)
    private Contract contrat;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;

    // remplacer par les champs du formulaire d'évaluation (l'énoncé)
    @Column(length = 2000)
    private String commentaire;

    private LocalDateTime dateSoumission = LocalDateTime.now();
}