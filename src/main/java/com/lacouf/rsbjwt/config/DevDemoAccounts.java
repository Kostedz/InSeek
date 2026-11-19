package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.auth.Role;

import java.util.List;
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

    private static final Account SIGNED_CONTRACT_STUDENT = new Account(
            "emile.tremblay@inseek.local",
            "DemoContrat!2026",
            "Tremblay",
            "Émile",
            "INFORMATIQUE"
    );

    private static final Account SECOND_STUDENT = new Account(
            "pascal.carbonneau@inseek.local",
            "DemoEtudiant!2026",
            "Carbonneau",
            "Pascal",
            "INFORMATIQUE"
    );

    private static final Account THIRD_STUDENT = new Account(
            "maya.chen@inseek.local",
            "DemoContrat!2026",
            "Chen",
            "Maya",
            "INFORMATIQUE"
    );

    private static final Account FOURTH_STUDENT = new Account(
            "lucas.bergeron@inseek.local",
            "DemoContrat!2026",
            "Bergeron",
            "Lucas",
            "INFORMATIQUE"
    );

    private static final List<Account> HIVER_2026_STUDENTS = List.of(
            new Account(
                    "sarah.lavoie@inseek.local",
                    "DemoEtudiant!2026",
                    "Lavoie",
                    "Sarah",
                    "INFORMATIQUE"
            ),
            new Account(
                    "felix.ouellet@inseek.local",
                    "DemoEtudiant!2026",
                    "Ouellet",
                    "Félix",
                    "ADMINISTRATION"
            ),
            new Account(
                    "nadia.khalil@inseek.local",
                    "DemoEtudiant!2026",
                    "Khalil",
                    "Nadia",
                    "COMPTABILITE"
            ),
            new Account(
                    "thomas.desjardins@inseek.local",
                    "DemoEtudiant!2026",
                    "Desjardins",
                    "Thomas",
                    "INFORMATIQUE"
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

    public static Account signedContractStudent() {
        return SIGNED_CONTRACT_STUDENT;
    }

    public static Account secondStudent() {
        return SECOND_STUDENT;
    }

    public static Account thirdStudent() {
        return THIRD_STUDENT;
    }

    public static Account fourthStudent() {
        return FOURTH_STUDENT;
    }

    public static List<Account> hiver2026Students() {
        return HIVER_2026_STUDENTS;
    }
}
