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
import com.lacouf.rsbjwt.service.dto.PrefillStudentEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.StudentEvaluationDTO;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationController.class)
class StudentEvaluationControllerTest {

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
    private String studentEvaluationJson;
    private PrefillStudentEvaluationDTO prefillDTO;
    private StudentEvaluationDTO evaluationDTO;

    @BeforeEach
    void setUp() {
        jwt = "test-jwt-token";
        email = "ubisoft@mail.com";

        when(jwtTokenProvider.getEmailFromJWT(jwt)).thenReturn(email);

        prefillDTO = new PrefillStudentEvaluationDTO(
                10L,
                "Ubi Soft",
                "UbiSoft",
                1L,
                "Alex Bouchard",
                50L,
                "Développeur Java",
                100L,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 8, 31),
                Disciplines.INFORMATIQUE
        );

        evaluationDTO = new StudentEvaluationDTO(
                200L,
                10L,
                1L,
                100L,
                50L,
                4.5,
                4.0,
                5.0,
                4.5,
                4.0,
                Disciplines.INFORMATIQUE,
                "Très bon travail",
                EvaluationState.SUBMITTED,
                LocalDate.now()
        );

        studentEvaluationJson = """
                {
                    "internId": 1,
                    "professionalismRating": 4.5,
                    "workQualityRating": 4.0,
                    "teamworkRating": 5.0,
                    "communicationRating": 4.5,
                    "objectiveReachedRating": 4.0,
                    "discipline": "INFORMATIQUE",
                    "evaluationComment": "Très bon travail"
                }
                """;
    }

    // ==================== Prefill student evaluation ====================

    @Test
    @DisplayName("Pré-remplir évaluation étudiant par GET /evaluations/etudiant/prefill/{studentId} - Success")
    void getPreFillStudentEvaluationSuccess() throws Exception {
        when(evaluationService.getPrefillStudentEvaluation(eq(email), eq(1L)))
                .thenReturn(prefillDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Pré-remplir évaluation étudiant par GET /evaluations/etudiant/prefill/{studentId} - NotFoundException")
    void getPreFillStudentEvaluationNotFound() throws Exception {
        when(evaluationService.getPrefillStudentEvaluation(eq(email), eq(1L)))
                .thenThrow(new NotFoundException("Étudiant introuvable"));

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Pré-remplir évaluation étudiant par GET /evaluations/etudiant/prefill/{studentId} - BadRequestException")
    void getPreFillStudentEvaluationBadRequest() throws Exception {
        when(evaluationService.getPrefillStudentEvaluation(eq(email), eq(1L)))
                .thenThrow(new BadRequestException("Aucun contrat trouvé"));

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/prefill/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }

    // ==================== Submit student evaluation ====================

    @Test
    @DisplayName("Soumettre évaluation étudiant par POST /evaluations/etudiant - Success (201 Created)")
    void submitStudentEvaluationSuccess() throws Exception {
        when(evaluationService.submitEvaluation(any(StudentEvaluationDTO.class), eq(email)))
                .thenReturn(evaluationDTO);

        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/etudiant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Soumettre évaluation étudiant par POST /evaluations/etudiant - ConflictException")
    void submitStudentEvaluationConflict() throws Exception {
        when(evaluationService.submitEvaluation(any(StudentEvaluationDTO.class), eq(email)))
                .thenThrow(new ConflictException("Évaluation déjà soumise"));

        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/etudiant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Soumettre évaluation étudiant par POST /evaluations/etudiant - BadRequestException")
    void submitStudentEvaluationBadRequest() throws Exception {
        when(evaluationService.submitEvaluation(any(StudentEvaluationDTO.class), eq(email)))
                .thenThrow(new BadRequestException("Les notes doivent être comprises entre 1 et 5"));

        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/etudiant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Soumettre évaluation étudiant par POST /evaluations/etudiant - NotFoundException")
    void submitStudentEvaluationNotFound() throws Exception {
        when(evaluationService.submitEvaluation(any(StudentEvaluationDTO.class), eq(email)))
                .thenThrow(new NotFoundException("Étudiant introuvable"));

        mockMvc.perform(MockMvcRequestBuilders.post("/evaluations/etudiant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentEvaluationJson)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    // ==================== Retrieve submitted student evaluation ====================

    @Test
    @DisplayName("Obtenir évaluation étudiant soumise par GET /evaluations/etudiant/{studentId} - Success")
    void getSubmittedStudentEvaluationSuccess() throws Exception {
        when(evaluationService.getSubmittedStudentEvaluation(eq(email), eq(1L)))
                .thenReturn(evaluationDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Obtenir évaluation étudiant soumise par GET /evaluations/etudiant/{studentId} - NotFoundException")
    void getSubmittedStudentEvaluationNotFound() throws Exception {
        when(evaluationService.getSubmittedStudentEvaluation(eq(email), eq(1L)))
                .thenThrow(new NotFoundException("Aucune évaluation trouvée"));

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Obtenir évaluation étudiant soumise par GET /evaluations/etudiant/{studentId} - BadRequestException")
    void getSubmittedStudentEvaluationBadRequest() throws Exception {
        when(evaluationService.getSubmittedStudentEvaluation(eq(email), eq(1L)))
                .thenThrow(new BadRequestException("Aucun contrat trouvé"));

        mockMvc.perform(MockMvcRequestBuilders.get("/evaluations/etudiant/1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }
}
