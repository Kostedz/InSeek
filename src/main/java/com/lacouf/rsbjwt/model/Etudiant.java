package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    private Disciplines discipline;
    
    @Builder
    public Etudiant(Long id, String nom, String prenom, Disciplines discipline, String email, String password) {
        super(id, nom, prenom, Credentials.builder().email(email).password(password).role(Role.ETUDIANT).build());
        this.discipline = discipline;
    }
}
