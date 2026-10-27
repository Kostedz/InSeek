package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.StatutRechercheEtudiant;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtAuthenticationEntryPoint;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.AssignationProfesseurService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AssignationProfesseurController.class)
class AssignationProfesseurControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AssignationProfesseurService assignationProfesseurService;

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

    private StagiaireDTO stagiaire(Long professeurId) {
        return new StagiaireDTO(1L, "bib", "bib", "bib@a.com", Disciplines.INFORMATIQUE,
                StatutRechercheEtudiant.INTERNSHIP_FOUND, professeurId,
                professeurId == null ? null : "Gagnon", professeurId == null ? null : "Bob");
    }

    // TESTER listStagiaires()

    @Test
    @DisplayName("GET /gestionnaire/stagiaires retourne 200 et la liste des étudiants")
    void listStagiaires_retourne200() throws Exception {
        when(assignationProfesseurService.listStagiaires()).thenReturn(List.of(stagiaire(7L)));

        mockMvc.perform(get("/gestionnaire/stagiaires"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("bib@a.com"))
                .andExpect(jsonPath("$[0].professeurId").value(7))
                .andExpect(jsonPath("$[0].professeurNom").value("Gagnon"));
    }

    // TESTER listProfesseurs()

    @Test
    @DisplayName("GET /gestionnaire/professeurs retourne 200 et la liste des professeurs")
    void listProfesseurs_retourne200() throws Exception {
        when(assignationProfesseurService.listProfesseurs()).thenReturn(List.of(
                new ProfesseurDTO(7L, "Gagnon", "Bob", "bob@mail.com", "PROFESSEUR", Disciplines.INFORMATIQUE)));

        mockMvc.perform(get("/gestionnaire/professeurs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(7))
                .andExpect(jsonPath("$[0].nom").value("Gagnon"));
    }

    // TESTER assignerProfesseur()

    @Test
    @DisplayName("PUT /gestionnaire/stagiaires/{id}/professeur retourne 200 et le professeur assigné")
    void assignerProfesseur_retourne200() throws Exception {
        when(assignationProfesseurService.assignerProfesseur(1L, 7L)).thenReturn(stagiaire(7L));

        mockMvc.perform(put("/gestionnaire/stagiaires/1/professeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professeurId": 7
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professeurId").value(7))
                .andExpect(jsonPath("$.professeurNom").value("Gagnon"));
    }

    @Test
    @DisplayName("PUT /gestionnaire/stagiaires/{id}/professeur avec un étudiant introuvable retourne 404")
    void assignerProfesseur_etudiantIntrouvable_retourne404() throws Exception {
        when(assignationProfesseurService.assignerProfesseur(99L, 7L))
                .thenThrow(new NotFoundException("Étudiant non trouvé"));

        mockMvc.perform(put("/gestionnaire/stagiaires/99/professeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professeurId": 7
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /gestionnaire/stagiaires/{id}/professeur avec un professeur introuvable retourne 404")
    void assignerProfesseur_professeurIntrouvable_retourne404() throws Exception {
        when(assignationProfesseurService.assignerProfesseur(1L, 99L))
                .thenThrow(new NotFoundException("Professeur non trouvé"));

        mockMvc.perform(put("/gestionnaire/stagiaires/1/professeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professeurId": 99
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /gestionnaire/stagiaires/{id}/professeur sans professeurId retourne 400")
    void assignerProfesseur_sansProfesseur_retourne400() throws Exception {
        when(assignationProfesseurService.assignerProfesseur(1L, null))
                .thenThrow(new BadRequestException("Le professeur est obligatoire."));

        mockMvc.perform(put("/gestionnaire/stagiaires/1/professeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}