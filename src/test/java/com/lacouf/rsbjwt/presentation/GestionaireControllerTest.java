package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtAuthenticationEntryPoint;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.GestionnaireService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GestionnaireController.class)
class GestionaireControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    GestionnaireService gestionnaireService;

    @MockitoBean
    JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockitoBean
    UtilisateurRepository utilisateurRepository;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    UtilisateurService utilisateurService;


    @Test
    @DisplayName("GET /gestionnaire/documents/pending/{type} retourne 200 et la liste des documents en attente")
    void listPendingDocuments_retourne200() throws Exception {

        DocumentValidationDTO doc1 = new DocumentValidationDTO(
                1L,
                "cv_alice.pdf",
                "alice@mail.com",
                StatutValidation.EN_ATTENTE,
                null,
                1024L,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        DocumentValidationDTO doc2 = new DocumentValidationDTO(
                2L,
                "offre_ubisoft.pdf",
                "ubisoft@mail.com",
                StatutValidation.EN_ATTENTE,
                null,
                2048L,
                "Ubisoft",
                "Développeur Java",
                "Marie Tremblay",
                "514-555-1234",
                LocalDate.of(2026, 5, 4),
                LocalDate.of(2026, 8, 28),
                Disciplines.INFORMATIQUE,
                "123 rue Saint-Laurent, Montréal",
                "Développement de jeux vidéo"
        );

        when(gestionnaireService.listPendingDocuments(anyString())).thenReturn(List.of(doc1, doc2));

        mockMvc.perform(get("/gestionnaire/documents/pending").queryParam("type", "CV"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fileName").value("cv_alice.pdf"))
                .andExpect(jsonPath("$[0].nomEntreprise").doesNotExist())
                .andExpect(jsonPath("$[1].fileName").value("offre_ubisoft.pdf"))
                .andExpect(jsonPath("$[1].nomEntreprise").value("Ubisoft"))
                .andExpect(jsonPath("$[1].position").value("Développeur Java"))
                .andExpect(jsonPath("$[1].targetDiscipline").value("INFORMATIQUE"));
    }

    @Test
    @DisplayName("GET /gestionnaire/documents/pending retourne 200 et une liste vide s'il n'y a rien en attente")
    void listPendingDocuments_listeVide_retourne200() throws Exception {

        when(gestionnaireService.listPendingDocuments(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/gestionnaire/documents/pending").queryParam("type", "CV"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/approve avec un document en attente retourne 200 et le statut VALIDE")
    void approveDocument_succes_retourne200() throws Exception {

        DocumentValidationDTO dto = new DocumentValidationDTO(
                1L,
                "cv_alice.pdf",
                "alice@mail.com",
                StatutValidation.VALIDE,
                null,
                1024L,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(gestionnaireService.approveDocument(1L)).thenReturn(dto);

        mockMvc.perform(put("/gestionnaire/documents/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("VALIDE"));
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/approve avec un id inexistant retourne 404")
    void approveDocument_documentInexistant_retourne404() throws Exception {

        when(gestionnaireService.approveDocument(999L))
                .thenThrow(new NotFoundException("Document introuvable"));

        mockMvc.perform(put("/gestionnaire/documents/999/approve"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/approve sur un document déjà traité retourne 400")
    void approveDocument_dejaTraite_retourne400() throws Exception {

        when(gestionnaireService.approveDocument(1L))
                .thenThrow(new BadRequestException("Ce document a déjà été traité."));

        mockMvc.perform(put("/gestionnaire/documents/1/approve"))
                .andExpect(status().isBadRequest());
    }


    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/reject avec un commentaire retourne 200 et le statut REJETE")
    void rejectDocument_succes_retourne200() throws Exception {

        DocumentValidationDTO dto = new DocumentValidationDTO(
                1L,
                "cv_alice.pdf",
                "alice@mail.com",
                StatutValidation.REJETE,
                "Format non professionnel",
                1024L,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        when(gestionnaireService.rejectDocument(eq(1L), any())).thenReturn(dto);

        mockMvc.perform(
                        put("/gestionnaire/documents/1/reject")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "commentaire": "Format non professionnel"
                                    }
                                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("REJETE"))
                .andExpect(jsonPath("$.commentaireRejet").value("Format non professionnel"));
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/reject avec un id inexistant retourne 404")
    void rejectDocument_documentInexistant_retourne404() throws Exception {

        when(gestionnaireService.rejectDocument(eq(999L), any()))
                .thenThrow(new NotFoundException("Document introuvable"));

        mockMvc.perform(
                        put("/gestionnaire/documents/999/reject")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "commentaire": "Format non professionnel"
                                    }
                                    """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/reject sans commentaire retourne 400")
    void rejectDocument_sansCommentaire_retourne400() throws Exception {

        when(gestionnaireService.rejectDocument(eq(1L), any()))
                .thenThrow(new BadRequestException("Un commentaire est obligatoire pour refuser un document."));

        mockMvc.perform(
                        put("/gestionnaire/documents/1/reject")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "commentaire": ""
                                    }
                                    """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /gestionnaire/documents/{id}/reject sur un document déjà traité retourne 400")
    void rejectDocument_dejaTraite_retourne400() throws Exception {

        when(gestionnaireService.rejectDocument(eq(1L), any()))
                .thenThrow(new BadRequestException("Ce document a déjà été traité."));

        mockMvc.perform(
                        put("/gestionnaire/documents/1/reject")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "commentaire": "Trop tard"
                                    }
                                    """))
                .andExpect(status().isBadRequest());
    }
}
