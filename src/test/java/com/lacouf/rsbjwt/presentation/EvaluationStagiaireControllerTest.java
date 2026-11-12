
package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtAuthenticationEntryPoint;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.EvaluationStagiaireService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.EvaluationStagiaireDTO;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.security.Principal;
import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationStagiaireController.class)
class EvaluationStagiaireControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    EvaluationStagiaireService evaluationService;

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

    private final Principal employeur = () -> "ubisoft@mail.com";

    private MockHttpServletRequestBuilder requete() {
        return post("/evaluations/contracts/10")
                .principal(employeur)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "commentaire": "Très bon stagiaire"
                        }
                        """);
    }

    // soumettre une evaluation

    @Test
    @DisplayName("POST /evaluations/contracts/{id} retourne 201 et l'id de l'évaluation")
    void soumettre_retourne201() throws Exception {
        when(evaluationService.soumettre(10L, "Très bon stagiaire", "ubisoft@mail.com"))
                .thenReturn(7L);

        mockMvc.perform(requete())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @DisplayName("POST /evaluations/contracts/{id} avec un commentaire invalide retourne 400")
    void soumettre_commentaireInvalide_retourne400() throws Exception {
        when(evaluationService.soumettre(10L, "Très bon stagiaire", "ubisoft@mail.com"))
                .thenThrow(new BadRequestException("Le commentaire d'évaluation est obligatoire."));

        mockMvc.perform(requete())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /evaluations/contracts/{id} avec un contrat introuvable retourne 404")
    void soumettre_contratIntrouvable_retourne404() throws Exception {
        when(evaluationService.soumettre(10L, "Très bon stagiaire", "ubisoft@mail.com"))
                .thenThrow(new NotFoundException("Contrat non trouvé"));

        mockMvc.perform(requete())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /evaluations/contracts/{id} avec une évaluation déjà soumise retourne 409")
    void soumettre_dejaSoumise_retourne409() throws Exception {
        when(evaluationService.soumettre(10L, "Très bon stagiaire", "ubisoft@mail.com"))
                .thenThrow(new ConflictException("L'évaluation de ce stagiaire a déjà été soumise."));

        mockMvc.perform(requete())
                .andExpect(status().isConflict());
    }

    // consulter une evaluation

    @Test
    @DisplayName("GET /evaluations/contracts/{id} retourne 200 et l'évaluation pour le professeur")
    void consulter_retourne200() throws Exception {
        Principal professeur = () -> "bob@mail.com";

        when(evaluationService.consulterPourProfesseur(10L, "bob@mail.com"))
                .thenReturn(new EvaluationStagiaireDTO(
                        7L,
                        10L,
                        "Demo Étudiant",
                        "UbiSoft",
                        "Très bon stagiaire",
                        LocalDateTime.now()
                ));

        mockMvc.perform(get("/evaluations/contracts/10").principal(professeur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contratId").value(10))
                .andExpect(jsonPath("$.entreprise").value("UbiSoft"));
    }

    @Test
    @DisplayName("GET /evaluations/contracts/{id} introuvable retourne 404")
    void consulter_introuvable_retourne404() throws Exception {
        Principal professeur = () -> "bob@mail.com";

        when(evaluationService.consulterPourProfesseur(10L, "bob@mail.com"))
                .thenThrow(new NotFoundException("Évaluation non trouvée"));

        mockMvc.perform(get("/evaluations/contracts/10").principal(professeur))
                .andExpect(status().isNotFound());
    }
}
