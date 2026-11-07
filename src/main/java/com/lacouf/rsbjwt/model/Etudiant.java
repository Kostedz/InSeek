package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    @Enumerated(EnumType.STRING)
    private Disciplines discipline;

    @Enumerated(EnumType.STRING)
    private StatutRechercheEtudiant statutRecherche = StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP;

    private String session;

    private LocalDateTime dateInterview;

    @ManyToOne
    @JoinColumn(name = "professeur_id")
    private Professeur professeur;

    @OneToMany(mappedBy = "etudiant")
    private List<ApplicationStage> candidatures = new ArrayList<>();

    @OneToMany(mappedBy = "student")
    private List<Contract> contrats = new ArrayList<>();

    @Builder
    public Etudiant(Long id, String nom, String prenom, Disciplines discipline, String session, String email, String password) {
        super(id, nom, prenom, Credentials.builder().email(email).password(password).role(Role.ETUDIANT).build());
        this.discipline = discipline;
        this.session = session;
    }
}
