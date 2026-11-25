package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.dto.SessionDTO;
import com.lacouf.rsbjwt.service.util.SessionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionServiceTest {

    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionService = new SessionService();
    }

    /** Exécute le service en fixant la date « aujourd'hui » à la date donnée. */
    private List<SessionDTO> listerAvecDate(LocalDate date) {
        try (MockedStatic<LocalDate> mocked = mockStatic(LocalDate.class, CALLS_REAL_METHODS)) {
            mocked.when(LocalDate::now).thenReturn(date);
            return sessionService.listerToutesLesSessions();
        }
    }

    @Test
    @DisplayName("listerToutesLesSessions() retourne 3 sessions par année depuis 2024 jusqu'à l'année courante")
    void lister_milieuAnnee_troisSessionsParAnnee() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 3, 10));

        assertEquals(9, result.size());
    }

    @Test
    @DisplayName("listerToutesLesSessions() retourne les sessions en ordre décroissant")
    void lister_ordreDecroissant() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 3, 10));

        assertEquals("A26", result.get(0).getId());
        assertEquals("E26", result.get(1).getId());
        assertEquals("H26", result.get(2).getId());
        assertEquals("A25", result.get(3).getId());
        assertEquals("H24", result.get(result.size() - 1).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() formate les noms avec le trimestre et l'année")
    void lister_noms() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 3, 10));

        assertEquals("Automne 2026", result.get(0).getName());
        assertEquals("Été 2026", result.get(1).getName());
        assertEquals("Hiver 2026", result.get(2).getName());
        assertEquals("Hiver 2024", result.get(result.size() - 1).getName());
    }

    @Test
    @DisplayName("listerToutesLesSessions() ne contient aucun doublon d'identifiant")
    void lister_idsUniques() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 3, 10));

        assertEquals(result.size(), result.stream().map(SessionDTO::getId).distinct().count());
    }

    @Test
    @DisplayName("listerToutesLesSessions() en 2024 retourne seulement les 3 sessions de 2024")
    void lister_anneeDeDebut_troisSessions() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2024, 5, 1));

        assertEquals(3, result.size());
        assertEquals("A24", result.get(0).getId());
        assertEquals("H24", result.get(2).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() marque comme courante la session retournée par SessionUtil")
    void lister_sessionCourante() {
        LocalDate date = LocalDate.of(2026, 3, 10);
        String codeAttendu = SessionUtil.getSession(date);

        List<SessionDTO> result = listerAvecDate(date);

        List<SessionDTO> courantes = result.stream().filter(SessionDTO::isCurrent).toList();
        assertEquals(1, courantes.size());
        assertEquals(codeAttendu, courantes.get(0).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() ne marque courante aucune autre session")
    void lister_autresSessionsNonCourantes() {
        LocalDate date = LocalDate.of(2025, 9, 20);
        String codeAttendu = SessionUtil.getSession(date);

        List<SessionDTO> result = listerAvecDate(date);

        result.stream()
                .filter(s -> !s.getId().equals(codeAttendu))
                .forEach(s -> assertFalse(s.isCurrent()));
    }

    @Test
    @DisplayName("listerToutesLesSessions() le 14 décembre n'ajoute pas l'année suivante")
    void lister_14Decembre_pasAnneeSuivante() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 12, 14));

        assertEquals(9, result.size());
        assertEquals("A26", result.get(0).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() le 15 décembre ajoute l'année suivante")
    void lister_15Decembre_ajouteAnneeSuivante() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 12, 15));

        assertEquals(12, result.size());
        assertEquals("A27", result.get(0).getId());
        assertEquals("Automne 2027", result.get(0).getName());
        assertEquals("H27", result.get(2).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() le 31 décembre ajoute l'année suivante")
    void lister_31Decembre_ajouteAnneeSuivante() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 12, 31));

        assertEquals(12, result.size());
        assertEquals("A27", result.get(0).getId());
    }

    @Test
    @DisplayName("listerToutesLesSessions() un 20 novembre n'ajoute pas l'année suivante (jour >= 15 mais mois != 12)")
    void lister_novembre_pasAnneeSuivante() {
        List<SessionDTO> result = listerAvecDate(LocalDate.of(2026, 11, 20));

        assertEquals(9, result.size());
    }

    @Test
    @DisplayName("listerToutesLesSessions() le 15 décembre marque comme courante la session de SessionUtil")
    void lister_15Decembre_sessionCourante() {
        LocalDate date = LocalDate.of(2026, 12, 15);
        String codeAttendu = SessionUtil.getSession(date);

        List<SessionDTO> result = listerAvecDate(date);

        assertTrue(result.stream().anyMatch(s -> s.isCurrent() && s.getId().equals(codeAttendu)));
    }
}
