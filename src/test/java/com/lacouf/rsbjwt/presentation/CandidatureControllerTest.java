package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.StatutCandidature;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtAuthenticationEntryPoint;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.CandidatureService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.CandidatureDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CandidatureController.class)
class CandidatureControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    CandidatureService candidatureService;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockitoBean
    UtilisateurRepository utilisateurRepository;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    // P: mais pourquoi vous faites toutes ça, utilisez juste @BeforeEach. Beaucoup plus clean
    private CandidatureDTO dto(StatutCandidature statut, String commentaire) {
        return new CandidatureDTO(
                5L,
                statut,
                commentaire,
                LocalDateTime.of(2026, 3, 1, 10, 0),
                null,
                "AUCUNE",
                statut == StatutCandidature.EN_ATTENTE ? null : LocalDateTime.of(2026, 3, 2, 9, 0),
                2L,
                "Doe",
                "John",
                "john@mail.com",
                Disciplines.INFORMATIQUE,
                10L,
                "Développeur Java",
                "UbiSoft",
                7L
        );
    }

    // ---------- GET /employeur/candidatures ----------

    @Test
    @DisplayName("GET /employeur/candidatures retourne 200 et la liste")
    void lister_retourne200() throws Exception {
        when(candidatureService.listerCandidatures(eq(null), any(HttpServletRequest.class)))
                .thenReturn(List.of(dto(StatutCandidature.EN_ATTENTE, null)));

        mockMvc.perform(get("/employeur/candidatures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].statut").value("EN_ATTENTE"))
                .andExpect(jsonPath("$[0].etudiantEmail").value("john@mail.com"))
                .andExpect(jsonPath("$[0].etatEntrevue").value("AUCUNE"));
    }

    @Test
    @DisplayName("GET /employeur/candidatures?offreId=10 filtre par offre")
    void lister_parOffre_retourne200() throws Exception {
        when(candidatureService.listerCandidatures(eq(10L), any(HttpServletRequest.class)))
                .thenReturn(List.of(dto(StatutCandidature.EN_ATTENTE, null)));

        mockMvc.perform(get("/employeur/candidatures").queryParam("offreId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].offreId").value(10));
    }

    @Test
    @DisplayName("GET /employeur/candidatures retourne 200 et une liste vide s'il n'y a rien")
    void lister_listeVide_retourne200() throws Exception {
        when(candidatureService.listerCandidatures(eq(null), any(HttpServletRequest.class)))
                .thenReturn(List.of());

        mockMvc.perform(get("/employeur/candidatures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /employeur/candidatures avec un JWT invalide retourne 400")
    void lister_jwtInvalide_retourne400() throws Exception {
        when(candidatureService.listerCandidatures(eq(null), any(HttpServletRequest.class)))
                .thenThrow(new BadRequestException("Invalid JWT token"));

        mockMvc.perform(get("/employeur/candidatures"))
                .andExpect(status().isBadRequest());
    }

    // ---------- GET /employeur/candidatures/{id} ----------

    @Test
    @DisplayName("GET /employeur/candidatures/{id} retourne 200 et le détail")
    void detail_retourne200() throws Exception {
        when(candidatureService.getCandidature(eq(5L), any(HttpServletRequest.class)))
                .thenReturn(dto(StatutCandidature.EN_ATTENTE, null));

        mockMvc.perform(get("/employeur/candidatures/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.offrePosition").value("Développeur Java"))
                .andExpect(jsonPath("$.cvId").value(7));
    }

    @Test
    @DisplayName("GET /employeur/candidatures/{id} avec un id inexistant retourne 404")
    void detail_inexistante_retourne404() throws Exception {
        when(candidatureService.getCandidature(eq(99L), any(HttpServletRequest.class)))
                .thenThrow(new NotFoundException("Candidature non trouvée"));

        mockMvc.perform(get("/employeur/candidatures/99"))
                .andExpect(status().isNotFound());
    }

    // ---------- GET /employeur/candidatures/{id}/cv ----------

    @Test
    @DisplayName("GET /employeur/candidatures/{id}/cv retourne 200 et le PDF")
    void cv_retourne200() throws Exception {
        byte[] pdf = "contenu pdf".getBytes();
        when(candidatureService.getCvCandidature(eq(5L), any(HttpServletRequest.class)))
                .thenReturn(new DocumentService.DocumentFile(pdf, "application/pdf"));

        mockMvc.perform(get("/employeur/candidatures/5/cv"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdf));
    }

    @Test
    @DisplayName("GET /employeur/candidatures/{id}/cv sans CV retourne 404")
    void cv_absent_retourne404() throws Exception {
        when(candidatureService.getCvCandidature(eq(5L), any(HttpServletRequest.class)))
                .thenThrow(new NotFoundException("CV non trouvé"));

        mockMvc.perform(get("/employeur/candidatures/5/cv"))
                .andExpect(status().isNotFound());
    }

    // ---------- PUT /employeur/candidatures/{id}/accept ----------

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/accept retourne 200 et le statut ACCEPTEE")
    void accepter_succes_retourne200() throws Exception {
        when(candidatureService.accepter(eq(5L), any(HttpServletRequest.class)))
                .thenReturn(dto(StatutCandidature.ACCEPTEE, null));

        mockMvc.perform(put("/employeur/candidatures/5/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("ACCEPTEE"))
                .andExpect(jsonPath("$.dateDecision").exists());
    }

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/accept sur une candidature déjà traitée retourne 400")
    void accepter_dejaTraitee_retourne400() throws Exception {
        when(candidatureService.accepter(eq(5L), any(HttpServletRequest.class)))
                .thenThrow(new BadRequestException("Cette candidature a déjà été traitée."));

        mockMvc.perform(put("/employeur/candidatures/5/accept"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Cette candidature a déjà été traitée."));
    }

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/accept avec un id inexistant retourne 404")
    void accepter_inexistante_retourne404() throws Exception {
        when(candidatureService.accepter(eq(99L), any(HttpServletRequest.class)))
                .thenThrow(new NotFoundException("Candidature non trouvée"));

        mockMvc.perform(put("/employeur/candidatures/99/accept"))
                .andExpect(status().isNotFound());
    }

    // ---------- PUT /employeur/candidatures/{id}/reject ----------

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/reject avec commentaire retourne 200 et le statut REFUSEE")
    void refuser_succes_retourne200() throws Exception {
        when(candidatureService.refuser(eq(5L), eq("Profil non adapté"), any(HttpServletRequest.class)))
                .thenReturn(dto(StatutCandidature.REFUSEE, "Profil non adapté"));

        mockMvc.perform(put("/employeur/candidatures/5/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentaire": "Profil non adapté"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("REFUSEE"))
                .andExpect(jsonPath("$.commentaireRefus").value("Profil non adapté"));
    }

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/reject sans commentaire retourne 400")
    void refuser_sansCommentaire_retourne400() throws Exception {
        when(candidatureService.refuser(eq(5L), eq(""), any(HttpServletRequest.class)))
                .thenThrow(new BadRequestException("Le commentaire est obligatoire pour refuser une candidature."));

        mockMvc.perform(put("/employeur/candidatures/5/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentaire": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Le commentaire est obligatoire pour refuser une candidature."));
    }

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/reject sur une candidature déjà traitée retourne 400")
    void refuser_dejaTraitee_retourne400() throws Exception {
        when(candidatureService.refuser(eq(5L), eq("Trop tard"), any(HttpServletRequest.class)))
                .thenThrow(new BadRequestException("Cette candidature a déjà été traitée."));

        mockMvc.perform(put("/employeur/candidatures/5/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentaire": "Trop tard"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /employeur/candidatures/{id}/reject avec un id inexistant retourne 404")
    void refuser_inexistante_retourne404() throws Exception {
        when(candidatureService.refuser(eq(99L), eq("Non"), any(HttpServletRequest.class)))
                .thenThrow(new NotFoundException("Candidature non trouvée"));

        mockMvc.perform(put("/employeur/candidatures/99/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentaire": "Non"
                                }
                                """))
                .andExpect(status().isNotFound());
    }
}