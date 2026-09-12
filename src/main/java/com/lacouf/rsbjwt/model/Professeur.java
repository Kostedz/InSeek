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

public class Professeur extends UserApp {

    @Enumerated(EnumType.STRING)
    private Disciplines discipline;

    @Builder Professeur(
            Long id, String firstName, String lastName, String email, String password, Disciplines discipline){
        super(id, firstName, lastName, Credentials.builder().email(email).password(password).role(Role.PROFESSEUR).build());
        this.discipline = discipline;
    }

}
