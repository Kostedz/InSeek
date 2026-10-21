package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.model.StatutValidation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ApplicationStageController.class)
class ApplicationStageControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ApplicationStageController controller;

    @MockitoBean
    ApplicationStageService applicationStageService;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    DocumentRepository documentRepository;

    private UsernamePasswordAuthenticationToken authentication;
    private Etudiant etudiant;

    @BeforeEach
    void setUp() {
        authentication = new UsernamePasswordAuthenticationToken(
                "alice@mail.com",
                null
        );

        etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);
    }

    @Test
    @DisplayName("POST /api/applications/5 retourne 201 lorsque la candidature est créée")
    void addApplicationStage_succes_retourne201() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        ApplicationStageDTO dto = new ApplicationStageDTO(
                10L,
                LocalDate.now(),
                null,
                null,
                StatutValidation.EN_ATTENTE
        );

        when(applicationStageService.createApplicationStage1(1L, 5L))
                .thenReturn(dto);

        mockMvc.perform(post("/api/applications/5")
                        .principal(authentication))
                .andExpect(status().isCreated());

        verify(utilisateurService).findEntityByEmail("alice@mail.com");
        verify(applicationStageService).createApplicationStage1(1L, 5L);
    }

    @Test
    @DisplayName("Le contrôleur propage NotFoundException si l'utilisateur n'existe pas")
    void addApplicationStage_utilisateurIntrouvable() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenThrow(new NotFoundException("Utilisateur introuvable"));

        assertThrows(
                NotFoundException.class,
                () -> controller.addApplicationStage(5L, authentication)
        );

        verifyNoInteractions(applicationStageService);
    }

    @Test
    @DisplayName("Le contrôleur propage BadRequestException si la candidature est refusée")
    void addApplicationStage_candidatureRefusee() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.createApplicationStage1(1L, 5L))
                .thenThrow(new BadRequestException("Candidature déjà existante"));

        assertThrows(
                BadRequestException.class,
                () -> controller.addApplicationStage(5L, authentication)
        );

        verify(applicationStageService).createApplicationStage1(1L, 5L);
    }

    @Test
    @DisplayName("Le contrôleur transmet l'identifiant de l'offre au service")
    void addApplicationStage_transmetIdentifiantOffre() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        ApplicationStageDTO dto = new ApplicationStageDTO(
                10L,
                LocalDate.now(),
                null,
                null,
                StatutValidation.EN_ATTENTE
        );

        when(applicationStageService.createApplicationStage1(1L, 99L))
                .thenReturn(dto);

        controller.addApplicationStage(99L, authentication);

        verify(applicationStageService).createApplicationStage1(1L, 99L);
    }
}