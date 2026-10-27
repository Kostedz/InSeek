package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.repository.ProfesseurRepository;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignationProfesseurServiceTest {

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private ProfesseurRepository professeurRepository;

    @InjectMocks
    private AssignationProfesseurService assignationProfesseurService;

    private Etudiant etudiant;
    private Professeur professeur;
    private Professeur autreProfesseur;

    @BeforeEach
    void setUp() {
        etudiant = Etudiant.builder()
                .id(1L).nom("bib").prenom("bib").email("bib@a.com")
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();

        professeur = Professeur.builder()
                .id(7L).nom("Gagnon").prenom("Bob").email("bob@mail.com")
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();

        autreProfesseur = Professeur.builder()
                .id(8L).nom("Roy").prenom("Lise").email("lise@mail.com")
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();
    }

    // TESTER listStagiaires()

    @Test
    @DisplayName("listStagiaires() retourne les étudiants avec leur professeur assigné")
    void listStagiaires_retourneEtudiantsAvecProfesseur() {
        etudiant.setProfesseur(professeur);
        when(etudiantRepository.findAll()).thenReturn(List.of(etudiant));

        List<StagiaireDTO> result = assignationProfesseurService.listStagiaires();

        assertEquals(1, result.size());
        assertEquals("bib@a.com", result.get(0).email());
        assertEquals(7L, result.get(0).professeurId());
        assertEquals("Gagnon", result.get(0).professeurNom());
    }

    @Test
    @DisplayName("listStagiaires() retourne un professeur null pour un étudiant non assigné")
    void listStagiaires_etudiantNonAssigne() {
        when(etudiantRepository.findAll()).thenReturn(List.of(etudiant));

        List<StagiaireDTO> result = assignationProfesseurService.listStagiaires();

        assertNull(result.get(0).professeurId());
        assertNull(result.get(0).professeurNom());
    }

    // TESTER listProfesseurs()

    @Test
    @DisplayName("listProfesseurs() retourne tous les professeurs")
    void listProfesseurs_retourneTous() {
        when(professeurRepository.findAll()).thenReturn(List.of(professeur, autreProfesseur));

        List<ProfesseurDTO> result = assignationProfesseurService.listProfesseurs();

        assertEquals(2, result.size());
        assertEquals("Gagnon", result.get(0).nom());
    }

    // TESTER assignerProfesseur()

    @Test
    @DisplayName("assignerProfesseur() lie le professeur à l'étudiant et sauvegarde")
    void assignerProfesseur_succes() throws Exception {
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(professeurRepository.findById(7L)).thenReturn(Optional.of(professeur));

        StagiaireDTO result = assignationProfesseurService.assignerProfesseur(1L, 7L);

        assertEquals(7L, result.professeurId());
        assertEquals(professeur, etudiant.getProfesseur());
        verify(etudiantRepository).save(etudiant);
    }

    @Test
    @DisplayName("assignerProfesseur() sur un étudiant déjà assigné remplace l'ancien professeur")
    void assignerProfesseur_reassignation() throws Exception {
        etudiant.setProfesseur(professeur);
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(professeurRepository.findById(8L)).thenReturn(Optional.of(autreProfesseur));

        StagiaireDTO result = assignationProfesseurService.assignerProfesseur(1L, 8L);

        assertEquals(8L, result.professeurId());
        assertEquals(autreProfesseur, etudiant.getProfesseur());
        verify(etudiantRepository).save(etudiant);
    }

    @Test
    @DisplayName("assignerProfesseur() avec un étudiant introuvable lève NotFoundException")
    void assignerProfesseur_etudiantIntrouvable() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> assignationProfesseurService.assignerProfesseur(99L, 7L));
        verify(etudiantRepository, never()).save(any());
    }

    @Test
    @DisplayName("assignerProfesseur() avec un professeur introuvable lève NotFoundException")
    void assignerProfesseur_professeurIntrouvable() {
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(professeurRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> assignationProfesseurService.assignerProfesseur(1L, 99L));
        verify(etudiantRepository, never()).save(any());
        assertNull(etudiant.getProfesseur());
    }

    @Test
    @DisplayName("assignerProfesseur() sans professeurId lève BadRequestException")
    void assignerProfesseur_professeurIdNull() {
        assertThrows(BadRequestException.class, () -> assignationProfesseurService.assignerProfesseur(1L, null));
        verifyNoInteractions(etudiantRepository, professeurRepository);
    }
}