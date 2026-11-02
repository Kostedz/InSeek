package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.StatutContrat;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.ContratService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ContratDTO;
import com.lacouf.rsbjwt.service.dto.CreateContratDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantEligibleContratDTO;
import com.lacouf.rsbjwt.service.dto.PreRemplirContratDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContratController.class)
@Import(ContratControllerTest.MethodSecurityTestConfig.class)
@WithMockUser(authorities = "GESTIONNAIRE")
class ContratControllerTest {



    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityTestConfig {
    }
    private static final String ELIGIBLE_URL = "/contracts/eligible-students";
    private static final String PREFILLED_URL = "/contracts/prefilled/{studentId}";
    private static final String CONTRACTS_URL = "/contracts/contracts";
    private static final String CONTRACT_BY_ID_URL = "/contracts/contracts/{id}";
    private static final String SIGN_URL = "/contracts/sign/{contractId}";
    private static final String STUDENT_URL = "/contracts/student";

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ContratService contratService;

    @MockitoBean
    AuthService authService;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    @MockitoBean
    JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    UtilisateurRepository utilisateurRepository;

    private String validCreateJson;
    private ContratDTO sampleContratDTO;

    @BeforeEach
    void setUp() {
        LocalDate debut = LocalDate.now().plusDays(10);
        LocalDate fin = LocalDate.now().plusMonths(3);

        validCreateJson = """
                {
                  "studentId": 1,
                  "offerId": 10,
                  "internshipStartingDate": "%s",
                  "internshipEndingDate": "%s",
                  "weeklyHours": 35,
                  "hourlySalary": 22.5,
                  "internshipLocation": "Montréal"
                }
                """.formatted(debut, fin);

        sampleContratDTO = ContratDTO.builder()
                .id(100L)
                .studentFullName("Jean Tremblay")
                .studentEmail("jean@test.ca")
                .fieldOfStudy("INFORMATIQUE")
                .companyName("Tech Corp")
                .employerFullName("Alice Tech")
                .offerTitle("Développeur Java")
                .supervisorName("Alice Tech")
                .internshipStartingDate(debut)
                .internshipEndingDate(fin)
                .weeklyHours(35)
                .hourlySalary(22.5)
                .internshipLocation("Montréal")
                .contractStatus(StatutContrat.PENDING_SIGNATURE)
                .contractDateCreation(LocalDateTime.now())
                .build();
    }


    @Test
    @DisplayName("GET /contracts/eligible-students retourne 200 et la liste des étudiants éligibles")
    void getEligibleStudents_succes_retourne200() throws Exception {
        EtudiantEligibleContratDTO row = new EtudiantEligibleContratDTO(
                1L, "Jean", "Tremblay", "jean@test.ca",
                Disciplines.INFORMATIQUE, false, 10L, "Développeur Java", "Tech Corp");
        when(contratService.getEtudiantsEligibles()).thenReturn(List.of(row));

        mockMvc.perform(get(ELIGIBLE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].firstName").value("Jean"))
                .andExpect(jsonPath("$[0].lastName").value("Tremblay"))
                .andExpect(jsonPath("$[0].offerId").value(10))
                .andExpect(jsonPath("$[0].offerTitle").value("Développeur Java"))
                .andExpect(jsonPath("$[0].companyName").value("Tech Corp"))
                .andExpect(jsonPath("$[0].hasContract").value(false));
    }

    @Test
    @DisplayName("GET /contracts/eligible-students avec un même étudiant et deux offres retourne deux lignes")
    void getEligibleStudents_plusieursOffres_retourneDeuxLignes() throws Exception {
        EtudiantEligibleContratDTO row1 = new EtudiantEligibleContratDTO(
                1L, "Jean", "Tremblay", "jean@test.ca",
                Disciplines.INFORMATIQUE, true, 10L, "Développeur Java", "Tech Corp");
        EtudiantEligibleContratDTO row2 = new EtudiantEligibleContratDTO(
                1L, "Jean", "Tremblay", "jean@test.ca",
                Disciplines.INFORMATIQUE, false, 11L, "Analyste", "Autre Corp");
        when(contratService.getEtudiantsEligibles()).thenReturn(List.of(row1, row2));

        mockMvc.perform(get(ELIGIBLE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].offerId").value(10))
                .andExpect(jsonPath("$[1].offerId").value(11));
    }

    @Test
    @DisplayName("GET /contracts/eligible-students sans étudiant éligible retourne 200 et une liste vide")
    void getEligibleStudents_aucun_retourneListeVide() throws Exception {
        when(contratService.getEtudiantsEligibles()).thenReturn(List.of());

        mockMvc.perform(get(ELIGIBLE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /contracts/prefilled/{studentId}?offerId= retourne 200 et les données pré-remplies")
    void preFilledContracts_succes_retourne200() throws Exception {
        PreRemplirContratDTO prefill = PreRemplirContratDTO.builder()
                .studentName("Jean Tremblay")
                .fieldOfStudy("INFORMATIQUE")
                .companyName("Tech Corp")
                .employerName("Alice Tech")
                .offerTitle("Développeur Java")
                .supervisorName("Alice Tech")
                .assignedTeacherName("Non assigné")
                .weeklyHours(35)
                .hourlySalary(22.5)
                .location("123 rue Sherbrooke")
                .build();
        when(contratService.getDonneesPreRemplies(1L, 10L)).thenReturn(prefill);

        mockMvc.perform(get(PREFILLED_URL, 1L).param("offerId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentName").value("Jean Tremblay"))
                .andExpect(jsonPath("$.companyName").value("Tech Corp"))
                .andExpect(jsonPath("$.offerTitle").value("Développeur Java"))
                .andExpect(jsonPath("$.assignedTeacherName").value("Non assigné"))
                .andExpect(jsonPath("$.weeklyHours").value(35))
                .andExpect(jsonPath("$.hourlySalary").value(22.5))
                .andExpect(jsonPath("$.location").value("123 rue Sherbrooke"));

        verify(contratService).getDonneesPreRemplies(1L, 10L);
    }

    @Test
    @DisplayName("GET /contracts/contracts/prefilled/{studentId} avec une offre non acceptée retourne 404")
    void preFilledContracts_offreNonAcceptee_retourne404() throws Exception {
        when(contratService.getDonneesPreRemplies(1L, 99L))
                .thenThrow(new NotFoundException("Cette offre n'est pas une offre acceptée pour cet étudiant."));

        mockMvc.perform(get(PREFILLED_URL, 1L).param("offerId", "99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /contracts/contracts/prefilled/{studentId} avec un étudiant sans stage trouvé retourne 400")
    void preFilledContracts_etudiantPasStageTrouve_retourne400() throws Exception {
        when(contratService.getDonneesPreRemplies(1L, 10L))
                .thenThrow(new BadRequestException("L'étudiant n'a pas le statut STAGE TROUVÉ."));

        mockMvc.perform(get(PREFILLED_URL, 1L).param("offerId", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /contracts/contracts avec des données valides retourne 201 et le contrat créé")
    void createContract_valide_retourne201() throws Exception {
        when(contratService.creerContrat(any(), any())).thenReturn(sampleContratDTO);

        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.studentFullName").value("Jean Tremblay"))
                .andExpect(jsonPath("$.companyName").value("Tech Corp"))
                .andExpect(jsonPath("$.contractStatus").value("PENDING_SIGNATURE"))
                .andExpect(jsonPath("$.internshipLocation").value("Montréal"));
    }

    @Test
    @DisplayName("POST /contracts/contracts transmet studentId et offerId au service")
    void createContract_valide_transmetLeDTOAuService() throws Exception {
        when(contratService.creerContrat(any(), any())).thenReturn(sampleContratDTO);

        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isCreated());

        verify(contratService).creerContrat(
                org.mockito.ArgumentMatchers.argThat(dto ->
                        dto.studentId().equals(1L)
                                && dto.offerId().equals(10L)
                                && dto.weeklyHours() == 35
                                && "Montréal".equals(dto.internshipLocation())),
                any());
    }

    @Test
    @DisplayName("POST /contracts/contracts avec des données invalides retourne 400")
    void createContract_donneesInvalides_retourne400() throws Exception {
        when(contratService.creerContrat(any(), any()))
                .thenThrow(new BadRequestException("La date de début ne peut pas être dans le passé."));

        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /contracts/contracts avec une offre non acceptée retourne 404")
    void createContract_offreNonAcceptee_retourne404() throws Exception {
        when(contratService.creerContrat(any(), any()))
                .thenThrow(new NotFoundException("Cette offre n'est pas une offre acceptée pour cet étudiant."));

        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /contracts/contracts avec un contrat déjà existant retourne 409")
    void createContract_contratDejaExistant_retourne409() throws Exception {
        when(contratService.creerContrat(any(), any()))
                .thenThrow(new ConflictException("Un contrat actif existe déjà pour cet étudiant et cette offre."));

        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isConflict());
    }


    @Test
    @DisplayName("POST /contracts/contracts avec un JSON mal formé retourne 400 sans appeler le service")
    void createContract_jsonMalForme_retourne400() throws Exception {
        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ ceci n'est pas du json"))
                .andExpect(status().isBadRequest());

        verify(contratService, never()).creerContrat(
                any(CreateContratDTO.class),
                any(HttpServletRequest.class)
        );
    }


    @Test
    @DisplayName("GET /contracts/contracts retourne 200 et la liste des contrats")
    void getContracts_succes_retourne200() throws Exception {
        when(contratService.listerContrats()).thenReturn(List.of(sampleContratDTO));

        mockMvc.perform(get(CONTRACTS_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].contractStatus").value("PENDING_SIGNATURE"));
    }

    @Test
    @DisplayName("GET /contracts/contracts sans contrat retourne 200 et une liste vide")
    void getContracts_aucun_retourneListeVide() throws Exception {
        when(contratService.listerContrats()).thenReturn(List.of());

        mockMvc.perform(get(CONTRACTS_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }


    @Test
    @DisplayName("GET /contracts/contracts/{id} avec un id existant retourne 200 et le contrat")
    void getContractsById_existant_retourne200() throws Exception {
        when(contratService.getContrat(100L)).thenReturn(sampleContratDTO);

        mockMvc.perform(get(CONTRACT_BY_ID_URL, 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.studentEmail").value("jean@test.ca"))
                .andExpect(jsonPath("$.employerFullName").value("Alice Tech"));
    }

    @Test
    @DisplayName("GET /contracts/contracts/{id} avec un id inexistant retourne 404")
    void getContractsById_inexistant_retourne404() throws Exception {
        when(contratService.getContrat(999L)).thenThrow(new NotFoundException("Contrat non trouvé"));

        mockMvc.perform(get(CONTRACT_BY_ID_URL, 999L))
                .andExpect(status().isNotFound());
    }


    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/eligible-students avec un rôle autre que GESTIONNAIRE retourne 403")
    void getEligibleStudents_mauvaisRole_retourne403() throws Exception {
        mockMvc.perform(get(ELIGIBLE_URL))
                .andExpect(status().isForbidden());

        verify(contratService, never()).getEtudiantsEligibles();
    }

    @Test
    @WithMockUser(authorities = "EMPLOYEUR")
    @DisplayName("POST /contracts/contracts avec un rôle autre que GESTIONNAIRE retourne 403")
    void createContract_mauvaisRole_retourne403() throws Exception {
        mockMvc.perform(post(CONTRACTS_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isForbidden());

        verify(contratService, never()).creerContrat(any(), any());
    }

    // ======================= Helper =======================

    private ContratDTO contratAvecStatut(StatutContrat statut) {
        return ContratDTO.builder()
                .id(100L)
                .studentFullName("Jean Tremblay")
                .contractStatus(statut)
                .build();
    }

    // ======================= PATCH /contracts/sign/{contractId} : succès =======================

    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("PATCH /contracts/sign/{id} par un étudiant retourne 200 et le contrat signé")
    void signContract_etudiant_retourne200() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenReturn(contratAvecStatut(StatutContrat.SIGNED_BY_STUDENT));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.contractStatus").value("SIGNED_BY_STUDENT"));
    }

    @Test
    @WithMockUser(authorities = "EMPLOYEUR")
    @DisplayName("PATCH /contracts/sign/{id} par un employeur retourne 200 et le contrat signé")
    void signContract_employeur_retourne200() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenReturn(contratAvecStatut(StatutContrat.SIGNED_BY_EMPLOYER));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractStatus").value("SIGNED_BY_EMPLOYER"));
    }

    @Test
    @WithMockUser(authorities = "GESTIONNAIRE")
    @DisplayName("PATCH /contracts/sign/{id} par un gestionnaire retourne 200 et le contrat signé")
    void signContract_gestionnaire_retourne200() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenReturn(contratAvecStatut(StatutContrat.SIGNED_BY_GESTIONNAIRE));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractStatus").value("SIGNED_BY_GESTIONNAIRE"));
    }

    @Test
    @DisplayName("PATCH /contracts/sign/{id} transmet l'id du contrat et la requête au service")
    void signContract_transmetIdEtRequeteAuService() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenReturn(contratAvecStatut(StatutContrat.SIGNED_BY_STUDENT));

        mockMvc.perform(patch(SIGN_URL, 100L)
                        .with(csrf())
                        .header("Authorization", "Bearer un-jeton"))
                .andExpect(status().isOk());

        verify(contratService).signContract(
                eq(100L),
                org.mockito.ArgumentMatchers.argThat((HttpServletRequest r) ->
                        "Bearer un-jeton".equals(r.getHeader("Authorization"))));
    }


    @Test
    @DisplayName("PATCH /contracts/sign/{id} avec un contrat inexistant retourne 404")
    void signContract_contratInexistant_retourne404() throws Exception {
        when(contratService.signContract(eq(404L), any()))
                .thenThrow(new NotFoundException("Contrat non trouvé "));

        mockMvc.perform(patch(SIGN_URL, 404L).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /contracts/sign/{id} avec une signature non permise retourne 400")
    void signContract_signatureNonPermise_retourne400() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenThrow(new BadRequestException("Le contrat ne peut pas être signé dans son état actuel."));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /contracts/sign/{id} par un utilisateur non lié au contrat retourne 400")
    void signContract_utilisateurNonLie_retourne400() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenThrow(new BadRequestException("L'utilisateur connecté n'est pas l'employeur associé à ce contrat."));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /contracts/sign/{id} avec un étudiant ayant déjà un contrat signé retourne 409")
    void signContract_etudiantDejaSigne_retourne409() throws Exception {
        when(contratService.signContract(eq(100L), any()))
                .thenThrow(new ConflictException("Un étudiant ne peut signer qu'un seul contrat."));

        mockMvc.perform(patch(SIGN_URL, 100L).with(csrf()))
                .andExpect(status().isConflict());
    }


    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/student retourne 200 et les contrats de l'étudiant")
    void getStudentContracts_succes_retourne200() throws Exception {
        when(contratService.listerContratsEtudiant(any()))
                .thenReturn(List.of(sampleContratDTO));

        mockMvc.perform(get(STUDENT_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].contractStatus").value("PENDING_SIGNATURE"));

        verify(contratService).listerContratsEtudiant(any(HttpServletRequest.class));
    }

    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/student sans contrat retourne 200 et une liste vide")
    void getStudentContracts_aucun_retourneListeVide() throws Exception {
        when(contratService.listerContratsEtudiant(any())).thenReturn(List.of());

        mockMvc.perform(get(STUDENT_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/student avec un jeton invalide retourne 400")
    void getStudentContracts_erreurService_retourne400() throws Exception {
        when(contratService.listerContratsEtudiant(any()))
                .thenThrow(new BadRequestException("Jeton d'authentification manquant."));

        mockMvc.perform(get(STUDENT_URL))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "GESTIONNAIRE")
    @DisplayName("GET /contracts/student par un gestionnaire retourne 403")
    void getStudentContracts_gestionnaire_retourne403() throws Exception {
        mockMvc.perform(get(STUDENT_URL))
                .andExpect(status().isForbidden());

        verify(contratService, never()).listerContratsEtudiant(any());
    }

    @Test
    @WithMockUser(authorities = "EMPLOYEUR")
    @DisplayName("GET /contracts/student par un employeur retourne 403")
    void getStudentContracts_employeur_retourne403() throws Exception {
        mockMvc.perform(get(STUDENT_URL))
                .andExpect(status().isForbidden());

        verify(contratService, never()).listerContratsEtudiant(any());
    }


    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/prefilled/{studentId} avec un rôle autre que GESTIONNAIRE retourne 403")
    void preFilledContracts_mauvaisRole_retourne403() throws Exception {
        mockMvc.perform(get(PREFILLED_URL, 1L).param("offerId", "10"))
                .andExpect(status().isForbidden());

        verify(contratService, never()).getDonneesPreRemplies(any(), any());
    }

    @Test
    @WithMockUser(authorities = "ETUDIANT")
    @DisplayName("GET /contracts/contracts avec un rôle autre que GESTIONNAIRE retourne 403")
    void getContracts_mauvaisRole_retourne403() throws Exception {
        mockMvc.perform(get(CONTRACTS_URL))
                .andExpect(status().isForbidden());

        verify(contratService, never()).listerContrats();
    }

    @Test
    @WithMockUser(authorities = "EMPLOYEUR")
    @DisplayName("GET /contracts/contracts/{id} avec un rôle autre que GESTIONNAIRE retourne 403")
    void getContractsById_mauvaisRole_retourne403() throws Exception {
        mockMvc.perform(get(CONTRACT_BY_ID_URL, 100L))
                .andExpect(status().isForbidden());

        verify(contratService, never()).getContrat(any());
    }
}