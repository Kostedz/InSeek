package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor

public class Gestionnaire extends Utilisateur{
    @Builder
    public Gestionnaire(Long id, String nom, String prenom, String email, String password) {
        super(id, nom, prenom, Credentials.builder().email(email).password(password).role(Role.GESTIONNAIRE).build());
    }
}
