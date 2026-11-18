package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.EvaluationState;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.EvaluationService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.CompanyEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.PrefillCompanyEvaluationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import java.time.LocalDate;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationController.class)
public class EvaluationControllerTest {
    @Autowired
    MockMvc mockMvc;
    @MockitoBean
    EvaluationService evaluationService;
    @MockitoBean
    JwtTokenProvider jwtTokenProvider;
    @MockitoBean
    UtilisateurRepository utilisateurRepository;
    @MockitoBean
    UtilisateurService utilisateurService;
    @MockitoBean
    DocumentService documentService;
    @MockitoBean
    AuthService authService;
    private String jwt;
    private String email;
    private String companyEvaluationJson;
    private PrefillCompanyEvaluationDTO prefillDTO;
    private CompanyEvaluationDTO evaluationDTO;
    @BeforeEach
    void setUp() {
        jwt = "test-jwt-token";
        email = "professeur@mail.com";
        when(jwtTokenProvider.getEmailFromJWT(jwt)).thenReturn(email);
        prefillDTO = new PrefillCompanyEvaluationDTO(
                10L,
                "Martin Tremblay",
                1L,
                "Alex Bouchard",
                20L,
                "CGI",
                "Sophie Lavoie",
                50L,
                "Développeur Java",
                100L,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 8, 31),
                Disciplines.INFORMATIQUE
        );
        evaluationDTO = new CompanyEvaluationDTO(
                200L,
                1L,
                100L,
                50L,
                4.5,
                4.0,
                5.0,
                LocalDate.of(2026, 6, 15),
                Disciplines.INFORMATIQUE,
                "Très bon travail",
                EvaluationState.SUBMITTED,
                LocalDate.now()
        );
        companyEvaluationJson = """
                {
                    "studentId": 1,
                    "contractId": 100,
                    "internshipOfferId": 50,
                    "supervisionRating": 4.5,
                    "taskComplianceRating": 4.0,
                    "workEnvironmentRating": 5.0,
                    "visitDate": "2026-06-15",
                    "discipline": "INFORMATIQUE",
                    "evaluationComment": "Très bon travail"
                }
                """;
    }

    @Test
    @DisplayName("Pré-remplir évaluation milieu par GET /evaluations/milieu/prefill/{studentId} - Success")
    void getPreFillCompanyEvaluationSuccess() throws Exception {
        when(evaluationService.getPreFillCompanyEvaluation(eq(email), eq(1L)))
                .thenReturn(prefillDTO);
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }
    @Test
    @DisplayName("Pré-remplir évaluation milieu par GET /evaluations/milieu/prefill/{studentId} - NotFoundException")
    void getPreFillCompanyEvaluationNotFound() throws Exception {
        when(evaluationService.getPreFillCompanyEvaluation(eq(email), eq(1L)))
                .thenThrow(new NotFoundException("Étudiant introuvable"));
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("Pré-remplir évaluation milieu par GET /evaluations/milieu/prefill/{studentId} - BadRequestException")
    void getPreFillCompanyEvaluationBadRequest() throws Exception {
        when(evaluationService.getPreFillCompanyEvaluation(eq(email), eq(1L)))
                .thenThrow(new BadRequestException("Aucun contrat actif"));
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Soumettre évaluation milieu par POST /evaluations/milieu - Success (201 Created)")
    void submitCompanyEvaluationSuccess() throws Exception {
        when(evaluationService.submitEvaluation(any(CompanyEvaluationDTO.class), eq(email)))
                .thenReturn(evaluationDTO);
        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/milieu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isCreated());
    }
    @Test
    @DisplayName("Soumettre évaluation milieu par POST /evaluations/milieu - ConflictException")
    void submitCompanyEvaluationConflict() throws Exception {
        when(evaluationService.submitEvaluation(any(CompanyEvaluationDTO.class), eq(email)))
                .thenThrow(new ConflictException("Évaluation déjà soumise"));
        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/milieu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isConflict());
    }
    @Test
    @DisplayName("Soumettre évaluation milieu par POST /evaluations/milieu - BadRequestException")
    void submitCompanyEvaluationBadRequest() throws Exception {
        when(evaluationService.submitEvaluation(any(CompanyEvaluationDTO.class), eq(email)))
                .thenThrow(new BadRequestException("Date de visite obligatoire"));
        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/milieu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }
    @Test
    @DisplayName("Soumettre évaluation milieu par POST /evaluations/milieu - NotFoundException")
    void submitCompanyEvaluationNotFound() throws Exception {
        when(evaluationService.submitEvaluation(any(CompanyEvaluationDTO.class), eq(email)))
                .thenThrow(new NotFoundException("Étudiant introuvable"));
        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/milieu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Obtenir évaluation soumise par GET /evaluations/milieu/{studentId} - Success")
    void getSubmittedCompanyEvaluationSuccess() throws Exception {
        when(evaluationService.getSubmittedCompanyEvaluation(eq(email), eq(1L)))
                .thenReturn(evaluationDTO);
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }
    @Test
    @DisplayName("Obtenir évaluation soumise par GET /evaluations/milieu/{studentId} - NotFoundException")
    void getSubmittedCompanyEvaluationNotFound() throws Exception {
        when(evaluationService.getSubmittedCompanyEvaluation(eq(email), eq(1L)))
                .thenThrow(new NotFoundException("Aucune évaluation trouvée"));
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("Obtenir évaluation soumise par GET /evaluations/milieu/{studentId} - BadRequestException")
    void getSubmittedCompanyEvaluationBadRequest() throws Exception {
        when(evaluationService.getSubmittedCompanyEvaluation(eq(email), eq(1L)))
                .thenThrow(new BadRequestException("Aucun contrat actif"));
        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/milieu/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }
}
