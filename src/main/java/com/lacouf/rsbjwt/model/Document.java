package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
@ToString
public abstract class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String fileName;

    @Enumerated(EnumType.STRING)
    private Disciplines targetDiscipline;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    protected Utilisateur utilisateur;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] data;

    private String contentType;
    private long size;

    @Enumerated(EnumType.STRING)
    private StatutValidation statut = StatutValidation.EN_ATTENTE;

    private String commentaireRejet;
}