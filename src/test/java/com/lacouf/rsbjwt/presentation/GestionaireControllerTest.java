package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    @DisplayName("GET /gestionnaire/documents/pending retourne 200 et la liste des documents en attente")
    void listPendingDocuments_retourne200() throws Exception {

        DocumentValidationDTO doc1 = new DocumentValidationDTO(
                1L, "cv_alice.pdf", "alice@mail.com", StatutValidation.EN_ATTENTE, null);
        DocumentValidationDTO doc2 = new DocumentValidationDTO(
                2L, "offre_ubisoft.pdf", "ubisoft@mail.com", StatutValidation.EN_ATTENTE, null);

        when(gestionnaireService.listPendingDocuments()).thenReturn(List.of(doc1, doc2));

        mockMvc.perform(get("/gestionnaire/documents/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fileName").value("cv_alice.pdf"))
                .andExpect(jsonPath("$[1].fileName").value("offre_ubisoft.pdf"));
    }

    @Test
    @DisplayName("GET /gestionnaire/documents/pending retourne 200 et une liste vide s'il n'y a rien en attente")
    void listPendingDocuments_listeVide_retourne200() throws Exception {

        when(gestionnaireService.listPendingDocuments()).thenReturn(List.of());

        mockMvc.perform(get("/gestionnaire/documents/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

}
