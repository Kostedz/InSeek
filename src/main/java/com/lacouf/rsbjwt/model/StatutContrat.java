package com.lacouf.rsbjwt.model;

public enum StatutContrat {
    PENDING_SIGNATURE,
    SIGNED_BY_STUDENT, // étape 1
    SIGNED_BY_EMPLOYER, // étape 2
    SIGNED_BY_GESTIONNAIRE, // étape 3
    EXECUTED, // contrat signé par toutes les parties et en cours d'exécution (apparemment le mot utilisé)
    REFUSED
}
