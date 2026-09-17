package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;

@Entity
@DiscriminatorValue("PR")
@Getter
@Setter
@ToString
@NoArgsConstructor

public class Professeur extends Utilisateur {

    @Enumerated(EnumType.STRING)
    private Disciplines discipline;

    @Builder public Professeur(
            Long id, String nom, String prenom, Disciplines discipline, String email, String password){
        super(id, nom, prenom, Credentials.builder().email(email).password(password).role(Role.PROFESSEUR).build());
        this.discipline = discipline;
    }

}
