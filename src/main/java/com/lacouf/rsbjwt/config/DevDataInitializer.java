package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Employeur;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev.email:dev@inseek.local}")
    private String email;

    @Value("${app.dev.password:DevInSeek!2026}")
    private String password;

    @Override
    public void run(String... args) {
        if (utilisateurRepository.findByEmail(email) == null) {
            utilisateurRepository.save(new Gestionnaire(
                    null,
                    "Dev",
                    "InSeek",
                    email,
                    passwordEncoder.encode(password)
            ));
        }

        DevDemoAccounts.all().forEach(this::createDemoAccountIfMissing);
    }

    private void createDemoAccountIfMissing(Role role, DevDemoAccounts.Account account) {
        if (utilisateurRepository.findByEmail(account.email()) != null) {
            return;
        }

        String encodedPassword = passwordEncoder.encode(account.password());
        Utilisateur utilisateur = switch (role) {
            case ETUDIANT -> new Etudiant(
                    null,
                    account.nom(),
                    account.prenom(),
                    Disciplines.valueOf(account.affiliation()),
                    account.email(),
                    encodedPassword
            );
            case PROFESSEUR -> new Professeur(
                    null,
                    account.nom(),
                    account.prenom(),
                    Disciplines.valueOf(account.affiliation()),
                    account.email(),
                    encodedPassword
            );
            case EMPLOYEUR -> new Employeur(
                    null,
                    account.nom(),
                    account.prenom(),
                    account.affiliation(),
                    account.email(),
                    encodedPassword
            );
            case GESTIONNAIRE -> new Gestionnaire(
                    null,
                    account.nom(),
                    account.prenom(),
                    account.email(),
                    encodedPassword
            );
            default -> throw new IllegalArgumentException("Rôle de démonstration non pris en charge: " + role);
        };

        utilisateurRepository.save(utilisateur);
    }
}
