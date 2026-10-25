package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuiviEtudiantsServiceTest {

    private static final String EMAIL_PROFESSEUR = "bob@mail.com";

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private ApplicationStageService applicationStageService;

    @InjectMocks
    private SuiviEtudiantsService suiviEtudiantsService;

    private Etudiant etudiant;
    private Professeur professeur;

    @BeforeEach
    void setUp() {
        professeur = Professeur.builder()
                .id(7L).nom("Gagnon").prenom("Bob").email(EMAIL_PROFESSEUR)
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();

        etudiant = Etudiant.builder()
                .id(1L).nom("bib").prenom("bib").email("bib@a.com")
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();
        etudiant.setProfesseur(professeur);
    }

    // TESTER listEtudiantsDuProfesseur()

    @Test
    @DisplayName("listEtudiantsDuProfesseur() retourne les étudiants assignés au professeur")
    void listEtudiantsDuProfesseur_retourneEtudiants() {
        when(etudiantRepository.findByProfesseurEmail(EMAIL_PROFESSEUR)).thenReturn(List.of(etudiant));

        List<StagiaireDTO> result = suiviEtudiantsService.listEtudiantsDuProfesseur(EMAIL_PROFESSEUR);

        assertEquals(1, result.size());
        assertEquals("bib@a.com", result.get(0).email());
        assertEquals(7L, result.get(0).professeurId());
    }

    @Test
    @DisplayName("listEtudiantsDuProfesseur() retourne une liste vide si aucun étudiant n'est assigné")
    void listEtudiantsDuProfesseur_aucunEtudiant() {
        when(etudiantRepository.findByProfesseurEmail(EMAIL_PROFESSEUR)).thenReturn(List.of());

        assertTrue(suiviEtudiantsService.listEtudiantsDuProfesseur(EMAIL_PROFESSEUR).isEmpty());
    }

    // TESTER listDemandesDeStage()

    @Test
    @DisplayName("listDemandesDeStage() retourne les demandes de l'étudiant du professeur")
    void listDemandesDeStage_succes() throws Exception {
        ApplicationStageDTO demande = new ApplicationStageDTO(
                5L, LocalDate.of(2026, 10, 1),
                EtudiantDTO.of(etudiant), null,
                StatutValidation.EN_ATTENTE, null, null, null);
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(applicationStageService.findApplicationsForStudent(etudiant)).thenReturn(List.of(demande));

        List<ApplicationStageDTO> result = suiviEtudiantsService.listDemandesDeStage(EMAIL_PROFESSEUR, 1L);

        assertEquals(1, result.size());
        assertEquals(StatutValidation.EN_ATTENTE, result.get(0).statutValidation());
    }

    @Test
    @DisplayName("listDemandesDeStage() avec un étudiant introuvable lève NotFoundException")
    void listDemandesDeStage_etudiantIntrouvable() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> suiviEtudiantsService.listDemandesDeStage(EMAIL_PROFESSEUR, 99L));
        verifyNoInteractions(applicationStageService);
    }

    @Test
    @DisplayName("listDemandesDeStage() d'un étudiant sans professeur lève NotFoundException")
    void listDemandesDeStage_etudiantSansProfesseur() {
        etudiant.setProfesseur(null);
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(NotFoundException.class, () -> suiviEtudiantsService.listDemandesDeStage(EMAIL_PROFESSEUR, 1L));
        verifyNoInteractions(applicationStageService);
    }

    @Test
    @DisplayName("listDemandesDeStage() d'un étudiant assigné à un autre professeur lève NotFoundException")
    void listDemandesDeStage_autreProfesseur() {
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(NotFoundException.class, () -> suiviEtudiantsService.listDemandesDeStage("autre@mail.com", 1L));
        verifyNoInteractions(applicationStageService);
    }
}