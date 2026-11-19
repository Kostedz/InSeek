package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.Gestionnaire;
import com.lacouf.rsbjwt.model.utilisateur.Professeur;
import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.util.SessionUtil;
import lombok.RequiredArgsConstructor;
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
    private final DevDemoScenarioService demoScenarioService;
    @Override
    public void run(String... args) {
        DevDemoAccounts.all().forEach(this::createDemoAccountIfMissing);
        createDemoAccountIfMissing(Role.ETUDIANT, DevDemoAccounts.signedContractStudent());
        createDemoAccountIfMissing(Role.ETUDIANT, DevDemoAccounts.secondStudent());
        createDemoAccountIfMissing(Role.ETUDIANT, DevDemoAccounts.thirdStudent());
        createDemoAccountIfMissing(Role.ETUDIANT, DevDemoAccounts.fourthStudent());
        DevDemoAccounts.hiver2026Students().forEach(account -> createDemoAccountWithSession(Role.ETUDIANT, account, "H26"));
        demoScenarioService.prepareExtraOffersScenario();
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
                    SessionUtil.getCurrentSession(),
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

    private void createDemoAccountWithSession(Role role, DevDemoAccounts.Account account, String session) {
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
                    session,
                    account.email(),
                    encodedPassword
            );
            default -> throw new IllegalArgumentException("Session personnalisée non prise en charge pour le rôle: " + role);
        };

        utilisateurRepository.save(utilisateur);
    }
}
