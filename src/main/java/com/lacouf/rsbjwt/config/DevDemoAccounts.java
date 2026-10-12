package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.auth.Role;

import java.util.Map;

public final class DevDemoAccounts {
    public record Account(String email, String password, String nom, String prenom, String affiliation) {
    }

    private static final Map<Role, Account> ACCOUNTS = Map.of(
            Role.ETUDIANT, new Account(
                    "demo.etudiant@inseek.local",
                    "DemoEtudiant!2026",
                    "Étudiant",
                    "Demo",
                    "INFORMATIQUE"
            ),
            Role.PROFESSEUR, new Account(
                    "demo.professeur@inseek.local",
                    "DemoProfesseur!2026",
                    "Professeur",
                    "Demo",
                    "INFORMATIQUE"
            ),
            Role.EMPLOYEUR, new Account(
                    "demo.employeur@inseek.local",
                    "DemoEmployeur!2026",
                    "Employeur",
                    "Demo",
                    "Entreprise démo"
            ),
            Role.GESTIONNAIRE, new Account(
                    "demo.gestionnaire@inseek.local",
                    "DemoGestionnaire!2026",
                    "Gestionnaire",
                    "Demo",
                    ""
            )
    );

    private DevDemoAccounts() {
    }

    public static Map<Role, Account> all() {
        return ACCOUNTS;
    }

    public static Account forRole(Role role) {
        return ACCOUNTS.get(role);
    }
}
