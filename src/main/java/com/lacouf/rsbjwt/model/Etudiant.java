package com.lacouf.rsbjwt.model;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class Etudiant extends Utilisateur {

    private Disciplines discipline;

    public Etudiant() {
        super();
    }

    public Etudiant(String email, String password, String nom, String prenom, Disciplines discipline) {
        super(email, password, nom, prenom);
        this.discipline = discipline;
    }

}
