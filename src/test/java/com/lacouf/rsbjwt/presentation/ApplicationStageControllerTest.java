package com.lacouf.rsbjwt.presentation;
import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.presentation.ApplicationStageController;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@WebMvcTest(ApplicationStageController.class)
class ApplicationStageControllerTest {

    @Autowired
    private ApplicationStageController controller;

    @MockitoBean
    private ApplicationStageService applicationStageService;

    @MockitoBean
    private UtilisateurService utilisateurService;

    @MockitoBean
    private DocumentService documentService;

    @MockitoBean
    private DocumentRepository documentRepository;

    @MockitoBean
    private UtilisateurRepository utilisateurRepository;

    private Authentication authentication;
    private Etudiant etudiant;
    private ApplicationStageDTO applicationDTO;
    private EtudiantDTO etudiantDTO;

    @BeforeEach
    void setUp() {
        authentication = new UsernamePasswordAuthenticationToken(
                "alice@mail.com",
                null
        );

        etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        applicationDTO = new ApplicationStageDTO(
                10L,
                LocalDate.now(),
                null,
                null,
                StatutValidation.EN_ATTENTE,
                null,
                null,
                null
        );

        etudiantDTO = new EtudiantDTO(
                1L,
                "Alice",
                "Tremblay",
                "alice@mail.com",
                "ETUDIANT",
                null
        );
    }

    // POST /api/applications/{offreId}

    @Test
    @DisplayName("Créer une candidature retourne 201 Created")
    void addApplicationStage_succes_retourne201() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.createApplicationStage1(1L, 5L))
                .thenReturn(applicationDTO);

        ResponseEntity<ApplicationStageDTO> response =
                controller.addApplicationStage(5L, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(applicationDTO, response.getBody());

        verify(utilisateurService).findEntityByEmail("alice@mail.com");
        verify(applicationStageService).createApplicationStage1(1L, 5L);
    }

    @Test
    @DisplayName("La création propage NotFoundException si l'utilisateur est introuvable")
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
    @DisplayName("La création propage BadRequestException si la candidature est refusée")
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
    @DisplayName("La création transmet le bon identifiant d'offre au service")
    void addApplicationStage_transmetIdentifiantOffre() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.createApplicationStage1(1L, 99L))
                .thenReturn(applicationDTO);

        controller.addApplicationStage(99L, authentication);

        verify(applicationStageService).createApplicationStage1(1L, 99L);
    }

    // GET /api/applications/my-applications

    @Test
    @DisplayName("Retourner les identifiants des offres auxquelles l'étudiant a postulé")
    void getMyApplications_succes() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findAppliedOfferIds(etudiant))
                .thenReturn(List.of(5L, 8L));

        List<Long> response = controller.getMyApplications(authentication);

        assertEquals(List.of(5L, 8L), response);

        verify(utilisateurService).findEntityByEmail("alice@mail.com");
        verify(applicationStageService).findAppliedOfferIds(etudiant);
    }

    @Test
    @DisplayName("Consulter ses identifiants de candidatures propage BadRequestException")
    void getMyApplications_utilisateurInvalide() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findAppliedOfferIds(etudiant))
                .thenThrow(new BadRequestException("Seuls les étudiants peuvent consulter leurs candidatures."));

        assertThrows(
                BadRequestException.class,
                () -> controller.getMyApplications(authentication)
        );
    }

    // GET /api/applications/my-applications/details

    @Test
    @DisplayName("Retourner les détails des candidatures de l'étudiant")
    void getMyApplicationDetails_succes() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findApplicationsForStudent(etudiant))
                .thenReturn(List.of(applicationDTO));

        List<ApplicationStageDTO> response =
                controller.getMyApplicationDetails(authentication);

        assertEquals(List.of(applicationDTO), response);

        verify(applicationStageService).findApplicationsForStudent(etudiant);
    }

    @Test
    @DisplayName("Les détails des candidatures propagent BadRequestException")
    void getMyApplicationDetails_utilisateurInvalide() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findApplicationsForStudent(etudiant))
                .thenThrow(new BadRequestException("Seuls les étudiants peuvent consulter leurs candidatures."));

        assertThrows(
                BadRequestException.class,
                () -> controller.getMyApplicationDetails(authentication)
        );
    }

    // GET /api/applications/offer/{offreId}

    @Test
    @DisplayName("Retourner les candidatures reçues pour une offre")
    void getApplicationsForOffer_succes() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findApplicationsForEmployer(etudiant, 5L))
                .thenReturn(List.of(applicationDTO));

        List<ApplicationStageDTO> response =
                controller.getApplicationsForOffer(5L, authentication);

        assertEquals(List.of(applicationDTO), response);

        verify(applicationStageService).findApplicationsForEmployer(etudiant, 5L);
    }

    @Test
    @DisplayName("La consultation des candidatures d'une offre propage BadRequestException")
    void getApplicationsForOffer_utilisateurInvalide() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findApplicationsForEmployer(etudiant, 5L))
                .thenThrow(new BadRequestException("Seuls les employeurs peuvent consulter les candidatures reçues."));

        assertThrows(
                BadRequestException.class,
                () -> controller.getApplicationsForOffer(5L, authentication)
        );
    }

    @Test
    @DisplayName("La consultation des candidatures propage NotFoundException")
    void getApplicationsForOffer_offreIntrouvable() throws Exception {
        when(utilisateurService.findEntityByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        when(applicationStageService.findApplicationsForEmployer(etudiant, 5L))
                .thenThrow(new NotFoundException("Offre de stage introuvable"));

        assertThrows(
                NotFoundException.class,
                () -> controller.getApplicationsForOffer(5L, authentication)
        );
    }

    // GET /api/applications/employeur/offres/{offreId}/candidatures

    @Test
    @DisplayName("Retourner les étudiants ayant postulé avec 200 OK")
    void voirCandidatsAUneOffre_succes() {
        when(applicationStageService.findEtudiantsByOffreDeStage(5L))
                .thenReturn(List.of(etudiantDTO));

        ResponseEntity<List<EtudiantDTO>> response =
                controller.voirCandidatsAUneOffre(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(etudiantDTO), response.getBody());

        verify(applicationStageService).findEtudiantsByOffreDeStage(5L);
    }

    @Test
    @DisplayName("Retourner une liste vide si aucun étudiant n'a postulé")
    void voirCandidatsAUneOffre_aucunCandidat() {
        when(applicationStageService.findEtudiantsByOffreDeStage(5L))
                .thenReturn(List.of());

        ResponseEntity<List<EtudiantDTO>> response =
                controller.voirCandidatsAUneOffre(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }
}