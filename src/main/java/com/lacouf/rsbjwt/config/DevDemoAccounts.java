package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.auth.Role;

import java.util.Map;

public final class DevDemoAccounts {
    public record Account(String email, String password, String nom, String prenom, String affiliation) {
    }

    private static final Map<Role, Account> ACCOUNTS = Map.of(
            Role.ETUDIANT, new Account(
                    "camille.gagnon@inseek.local",
                    "DemoEtudiant!2026",
                    "Gagnon",
                    "Camille",
                    "INFORMATIQUE"
            ),
            Role.PROFESSEUR, new Account(
                    "demo.professeur@inseek.local",
                    "DemoProfesseur!2026",
                    "Nguyen",
                    "Sophie",
                    "INFORMATIQUE"
            ),
            Role.EMPLOYEUR, new Account(
                    "demo.employeur@inseek.local",
                    "DemoEmployeur!2026",
                    "Bouchard",
                    "Alexandre",
                    "Nexora Technologies"
            ),
            Role.GESTIONNAIRE, new Account(
                    "demo.gestionnaire@inseek.local",
                    "DemoGestionnaire!2026",
                    "Fortin",
                    "Marc-André",
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
