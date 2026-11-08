package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private Utilisateur recipient;

    @Builder
    public Notification(Long id, String message, Utilisateur recipient) {
        this.id = id;
        this.message = message;
        this.recipient = recipient;
    }
}
