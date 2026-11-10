package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinataire_id")
    private Utilisateur destinataire;

    private String titre;

    @Column(length = 1000)
    private String me;

    private String lienDirect;

    @Builder.Default
    private boolean lue = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}