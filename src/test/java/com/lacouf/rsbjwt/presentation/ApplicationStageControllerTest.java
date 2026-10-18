package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Optional;

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
    DocumentRepository documentRepository;

    @MockitoBean
    DocumentService documentService;

    private UsernamePasswordAuthenticationToken authentication;
    private Etudiant etudiant;
    private OffreDeStage offre;

    @BeforeEach
    void setUp() {
        authentication = new UsernamePasswordAuthenticationToken(
                "alice@mail.com",
                null
        );

        etudiant = mock(Etudiant.class);
        offre = mock(OffreDeStage.class);
    }

    @Test
    @DisplayName("POST /api/applications/5 retourne 201 lorsque la candidature est créée")
    void addApplicationStage_succes_retourne201() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com")).thenReturn(etudiant);
        when(documentRepository.findOffreStageById(5L)).thenReturn(Optional.of(offre));
        ApplicationStageDTO dto = new ApplicationStageDTO(10L, LocalDate.now(), null, null, StatutValidation.EN_ATTENTE);
        when(applicationStageService.createApplicationStage(etudiant, offre)).thenReturn(dto);

        mockMvc.perform(post("/api/applications/5").principal(authentication))
                .andExpect(status().isCreated());

        verify(utilisateurService).findEntityByEmail("alice@mail.com");
        verify(documentRepository).findOffreStageById(5L);
        verify(applicationStageService).createApplicationStage(etudiant, offre);
    }

    @Test
    @DisplayName("Le contrôleur lève NotFoundException si l'offre n'existe pas")
    void addApplicationStage_offreInexistante() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com")).thenReturn(etudiant);
        when(documentRepository.findOffreStageById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> controller.addApplicationStage(99L, authentication));

        verify(applicationStageService, never()).createApplicationStage(any(), any());
    }

    @Test
    @DisplayName("Le contrôleur propage une erreur de recherche de l'utilisateur")
    void addApplicationStage_utilisateurIntrouvable() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenThrow(new NotFoundException("Utilisateur introuvable"));

        assertThrows(NotFoundException.class,
                () -> controller.addApplicationStage(5L, authentication));

        verifyNoInteractions(documentRepository, applicationStageService);
    }

    @Test
    @DisplayName("Le contrôleur propage un refus de candidature du service")
    void addApplicationStage_candidatureRefusee() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com")).thenReturn(etudiant);
        when(documentRepository.findOffreStageById(5L)).thenReturn(Optional.of(offre));
        when(applicationStageService.createApplicationStage(etudiant, offre))
                .thenThrow(new BadRequestException("Candidature déjà existante"));

        assertThrows(BadRequestException.class,
                () -> controller.addApplicationStage(5L, authentication));

        verify(applicationStageService).createApplicationStage(etudiant, offre);
    }
}
