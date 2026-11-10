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
@Table(uniqueConstraints = @UniqueConstraint(
        columnNames = {"type_notification", "contrat_id", "destinataire_id"}))
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destinataire_id")
    private Utilisateur destinataire;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_notification", nullable = false)
    private TypeNotification type;

    @ManyToOne
    @JoinColumn(name = "contrat_id")
    private Contract contrat;

    @Column(length = 1000)
    private String message;

    /** Lien direct vers la ressource (page de signature du contrat). */
    @Column(length = 500)
    private String lien;

    private boolean lue = false;

    /** false si l'utilisateur a désactivé les notifications In-App (le courriel part quand même). */
    private boolean inApp = true;

    // Courriel : contenu conservé pour pouvoir le renvoyer, et suivi d'envoi
    @Column(length = 300)
    private String sujetCourriel;

    @Column(length = 4000)
    private String corpsCourriel;

    @Enumerated(EnumType.STRING)
    private StatutEnvoiCourriel statutCourriel;

    private LocalDateTime dateEnvoi;

    private int tentatives = 0;

    private LocalDateTime dateCreation = LocalDateTime.now();
}