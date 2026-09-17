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
public class Employeur extends Utilisateur {
    private String nomCompagnie;

    @Builder
    public Employeur(Long id, String nom, String prenom, String nomCompagnie, String email, String password){
        super(id, nom, prenom, Credentials.builder().email(email),password(password).role(Role.EMPLOYEUR).build());
        this.nomCompagnie = nomCompagnie;
    }
}
