package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    protected Utilisateur() {}

    protected Utilisateur(String email, String password, String nom, String prenom) {
        this.email = email;
        this.password = password;
        this.nom = nom;
        this.prenom = prenom;
    }
}
