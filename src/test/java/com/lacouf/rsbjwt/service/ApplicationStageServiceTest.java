package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.document.CV;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.StatutRechercheEtudiant;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationStageServiceTest {

    @Mock
    private ApplicationStageRepository applicationStageRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private EntrevueRepository entrevueRepository;

    @InjectMocks
    private ApplicationStageService applicationStageService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private Etudiant etudiant;
    private Employeur employeur;
    private OffreDeStage offre;

    @BeforeEach
    void setUp() {
        etudiant = mock(Etudiant.class);
        employeur = mock(Employeur.class);
        offre = mock(OffreDeStage.class);
    }

    @Test
    @DisplayName("Un étudiant peut postuler à une offre")
    void createApplicationStage_succes() throws Exception {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);

        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(etudiant);

        when(documentRepository.findOffreById(5L))
                .thenReturn(offre);

        when(applicationStageRepository
                .existsByEtudiantIdAndOffreDeStageId(1L, 5L))
                .thenReturn(false);

        when(applicationStageRepository
                .existsByOffreDeStageIdAndStatutValidation(
                        5L, StatutValidation.ACCEPTE))
                .thenReturn(false);

        when(applicationStageRepository.save(any(ApplicationStage.class)))
                .thenAnswer(invocation -> {
                    ApplicationStage application = invocation.getArgument(0);
                    application.setId(10L);
                    return application;
                });

        when(documentRepository.findByUtilisateur(etudiant))
                .thenReturn(null);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion =
                     mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion =
                     mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant))
                    .thenReturn(etudiantDTO);

            offreConversion.when(() -> OffreDeStageDTO.of(offre))
                    .thenReturn(offreDTO);

            ApplicationStageDTO resultat =
                    applicationStageService.createApplicationStage1(1L, 5L);

            assertNotNull(resultat);
            assertEquals(10L, resultat.id());
            assertSame(etudiantDTO, resultat.etudiantDTO());
            assertSame(offreDTO, resultat.offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE,
                    resultat.statutValidation());

            ArgumentCaptor<ApplicationStage> captor =
                    ArgumentCaptor.forClass(ApplicationStage.class);

            verify(applicationStageRepository).save(captor.capture());

            ApplicationStage sauvegarde = captor.getValue();

            assertSame(etudiant, sauvegarde.getEtudiant());
            assertSame(offre, sauvegarde.getOffreDeStage());

            verify(applicationStageRepository)
                    .existsByEtudiantIdAndOffreDeStageId(1L, 5L);
        }
    }

    @Test
    @DisplayName("Un utilisateur inexistant ne peut pas postuler")
    void createApplicationStage_utilisateurIntrouvable() {
        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(null);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        verifyNoInteractions(documentRepository);
        verify(applicationStageRepository, never())
                .save(any(ApplicationStage.class));
    }

    @Test
    @DisplayName("Un employeur ne peut pas postuler")
    void createApplicationStage_nonEtudiant() {
        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(employeur);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        verifyNoInteractions(documentRepository);
        verify(applicationStageRepository, never())
                .save(any(ApplicationStage.class));
    }

    @Test
    @DisplayName("Une offre inexistante ne peut pas recevoir de candidature")
    void createApplicationStage_offreIntrouvable() {
        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(etudiant);

        when(documentRepository.findOffreById(5L))
                .thenReturn(null);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        verify(applicationStageRepository, never())
                .save(any(ApplicationStage.class));
    }

    @Test
    @DisplayName("Un étudiant ne peut pas postuler deux fois à la même offre")
    void createApplicationStage_doublon() {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);

        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(etudiant);

        when(documentRepository.findOffreById(5L))
                .thenReturn(offre);

        when(applicationStageRepository
                .existsByEtudiantIdAndOffreDeStageId(1L, 5L))
                .thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        verify(applicationStageRepository, never())
                .save(any(ApplicationStage.class));

        verify(applicationStageRepository, never())
                .existsByOffreDeStageIdAndStatutValidation(
                        anyLong(), any(StatutValidation.class));
    }

    @Test
    @DisplayName("Une offre déjà attribuée ne peut plus recevoir de candidature")
    void createApplicationStage_offreDejaAcceptee() {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);

        when(utilisateurRepository.findUtilisateurById(1L))
                .thenReturn(etudiant);

        when(documentRepository.findOffreById(5L))
                .thenReturn(offre);

        when(applicationStageRepository
                .existsByEtudiantIdAndOffreDeStageId(1L, 5L))
                .thenReturn(false);

        when(applicationStageRepository
                .existsByOffreDeStageIdAndStatutValidation(
                        5L, StatutValidation.ACCEPTE))
                .thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        verify(applicationStageRepository, never())
                .save(any(ApplicationStage.class));
    }

    @Test
    @DisplayName("Un étudiant peut consulter les identifiants des offres postulées")
    void findAppliedOfferIds_succes() throws Exception {
        when(etudiant.getId()).thenReturn(1L);

        when(applicationStageRepository.findOfferIdsByEtudiantId(1L))
                .thenReturn(List.of(5L, 6L));

        List<Long> resultat =
                applicationStageService.findAppliedOfferIds(etudiant);

        assertEquals(List.of(5L, 6L), resultat);

        verify(applicationStageRepository)
                .findOfferIdsByEtudiantId(1L);
    }

    @Test
    @DisplayName("Un employeur ne peut pas consulter les offres postulées d'un étudiant")
    void findAppliedOfferIds_nonEtudiant() {
        assertThrows(BadRequestException.class,
                () -> applicationStageService.findAppliedOfferIds(employeur));

        verifyNoInteractions(applicationStageRepository);
    }

    @Test
    @DisplayName("Un étudiant peut consulter ses candidatures")
    void findApplicationsForStudent_succes() throws Exception {
        when(etudiant.getId()).thenReturn(1L);

        ApplicationStage application = mock(ApplicationStage.class);
        when(application.getId()).thenReturn(10L);
        when(application.getDateApplique()).thenReturn(LocalDate.of(2026, 10, 16));
        when(application.getEtudiant()).thenReturn(etudiant);
        when(application.getOffreDeStage()).thenReturn(offre);
        when(application.getStatutValidation())
                .thenReturn(StatutValidation.EN_ATTENTE);

        when(offre.getId()).thenReturn(5L);

        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        when(applicationStageRepository.findByEtudiantId(1L))
                .thenReturn(List.of(application));

        when(documentRepository.findOffreStageSummaryById(5L))
                .thenReturn(Optional.of(offreDTO));

        when(documentRepository.findByUtilisateur(etudiant))
                .thenReturn(null);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);

        try (MockedStatic<EtudiantDTO> conversion =
                     mockStatic(EtudiantDTO.class)) {

            conversion.when(() -> EtudiantDTO.of(etudiant))
                    .thenReturn(etudiantDTO);

            List<ApplicationStageDTO> resultat =
                    applicationStageService.findApplicationsForStudent(etudiant);

            assertEquals(1, resultat.size());
            assertEquals(10L, resultat.getFirst().id());
            assertSame(etudiantDTO, resultat.getFirst().etudiantDTO());
            assertSame(offreDTO, resultat.getFirst().offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE,
                    resultat.getFirst().statutValidation());
        }
    }

    @Test
    @DisplayName("Un employeur ne peut pas consulter les candidatures d'un étudiant")
    void findApplicationsForStudent_nonEtudiant() {
        assertThrows(BadRequestException.class,
                () -> applicationStageService.findApplicationsForStudent(employeur));

        verifyNoInteractions(applicationStageRepository);
    }

    @Test
    @DisplayName("Un employeur peut consulter les candidatures de sa propre offre")
    void findApplicationsForEmployer_succes() throws Exception {
        when(employeur.getId()).thenReturn(2L);
        when(offre.getUtilisateur()).thenReturn(employeur);

        ApplicationStage application = mock(ApplicationStage.class);

        when(application.getEtudiant()).thenReturn(etudiant);
        when(application.getOffreDeStage()).thenReturn(offre);
        when(application.getId()).thenReturn(10L);
        when(application.getDateApplique()).thenReturn(LocalDate.of(2026, 10, 16));
        when(application.getStatutValidation())
                .thenReturn(StatutValidation.EN_ATTENTE);

        when(documentRepository.findOffreStageById(5L))
                .thenReturn(Optional.of(offre));

        when(applicationStageRepository.findByOffreDeStageId(5L))
                .thenReturn(List.of(application));

        when(documentRepository.findByUtilisateur(etudiant))
                .thenReturn(null);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion =
                     mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion =
                     mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant))
                    .thenReturn(etudiantDTO);

            offreConversion.when(() -> OffreDeStageDTO.of(offre))
                    .thenReturn(offreDTO);

            List<ApplicationStageDTO> resultat =
                    applicationStageService.findApplicationsForEmployer(
                            employeur, 5L);

            assertEquals(1, resultat.size());
            assertEquals(10L, resultat.getFirst().id());
            assertSame(etudiantDTO, resultat.getFirst().etudiantDTO());
            assertSame(offreDTO, resultat.getFirst().offreDeStageDTO());
        }
    }

    @Test
    @DisplayName("Un étudiant ne peut pas consulter les candidatures reçues par un employeur")
    void findApplicationsForEmployer_nonEmployeur() {
        assertThrows(BadRequestException.class,
                () -> applicationStageService.findApplicationsForEmployer(
                        etudiant, 5L));

        verifyNoInteractions(documentRepository);
        verifyNoInteractions(applicationStageRepository);
    }

    @Test
    @DisplayName("Un employeur ne peut pas consulter une offre inexistante")
    void findApplicationsForEmployer_offreIntrouvable() {
        when(documentRepository.findOffreStageById(5L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> applicationStageService.findApplicationsForEmployer(
                        employeur, 5L));

        verify(applicationStageRepository, never())
                .findByOffreDeStageId(anyLong());
    }

    @Test
    @DisplayName("Un employeur ne peut pas consulter les candidatures d'une offre appartenant à quelqu'un d'autre")
    void findApplicationsForEmployer_offreAutreEmployeur() {
        Employeur autreEmployeur = mock(Employeur.class);

        when(employeur.getId()).thenReturn(2L);
        when(autreEmployeur.getId()).thenReturn(3L);
        when(offre.getUtilisateur()).thenReturn(autreEmployeur);

        when(documentRepository.findOffreStageById(5L))
                .thenReturn(Optional.of(offre));

        assertThrows(NotFoundException.class,
                () -> applicationStageService.findApplicationsForEmployer(
                        employeur, 5L));

        verify(applicationStageRepository, never())
                .findByOffreDeStageId(anyLong());
    }

    @Test
    @DisplayName("Le service retourne les étudiants ayant postulé à une offre")
    void findEtudiantsByOffreDeStage_succes() {
        when(applicationStageRepository.findEtudiantsByOffreDeStage(5L))
                .thenReturn(List.of(etudiant));

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);

        try (MockedStatic<EtudiantDTO> conversion =
                     mockStatic(EtudiantDTO.class)) {

            conversion.when(() -> EtudiantDTO.of(etudiant))
                    .thenReturn(etudiantDTO);

            List<EtudiantDTO> resultat =
                    applicationStageService.findEtudiantsByOffreDeStage(5L);

            assertEquals(1, resultat.size());
            assertSame(etudiantDTO, resultat.getFirst());
        }
    }

    @Test
    @DisplayName("toDto convertit correctement une candidature")
    void toDto_convertitApplication() {
        ApplicationStage application = mock(ApplicationStage.class);

        when(application.getId()).thenReturn(42L);
        when(application.getDateApplique())
                .thenReturn(LocalDate.of(2026, 10, 16));
        when(application.getEtudiant()).thenReturn(etudiant);
        when(application.getOffreDeStage()).thenReturn(offre);
        when(application.getStatutValidation())
                .thenReturn(StatutValidation.EN_ATTENTE);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        when(documentRepository.findByUtilisateur(etudiant))
                .thenReturn(null);

        try (MockedStatic<EtudiantDTO> etudiantConversion =
                     mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion =
                     mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant))
                    .thenReturn(etudiantDTO);

            offreConversion.when(() -> OffreDeStageDTO.of(offre))
                    .thenReturn(offreDTO);

            ApplicationStageDTO resultat =
                    applicationStageService.toDto(application);

            assertEquals(42L, resultat.id());
            assertEquals(LocalDate.of(2026, 10, 16), resultat.dateApplique());
            assertSame(etudiantDTO, resultat.etudiantDTO());
            assertSame(offreDTO, resultat.offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE,
                    resultat.statutValidation());
        }
    }

    @Test
    @DisplayName("createApplicationStage - lève BadRequestException si la discipline ne correspond pas")
    void createApplicationStage_disciplineDifferente() {
        when(utilisateurRepository.findUtilisateurById(1L)).thenReturn(etudiant);
        when(documentRepository.findOffreById(5L)).thenReturn(offre);

        when(etudiant.getDiscipline()).thenReturn(Disciplines.INFORMATIQUE);
        when(offre.getTargetDiscipline()).thenReturn(Disciplines.DESIGN_GRAPHIQUE);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage1(1L, 5L));

        assertEquals("Cette offre de stage ne correspond pas à votre discipline.", ex.getMessage());
        verify(applicationStageRepository, never()).save(any());
    }

    @Test
    @DisplayName("accepter - succès : valide la candidature et met à jour le statut de l'étudiant")
    void accepter_succes() throws Exception {
        when(employeur.getId()).thenReturn(2L);
        when(offre.getUtilisateur()).thenReturn(employeur);
        when(offre.getId()).thenReturn(5L);

        ApplicationStage application = new ApplicationStage();
        application.setId(10L);
        application.setEtudiant(etudiant);
        application.setOffreDeStage(offre);
        application.setStatutValidation(StatutValidation.EN_ATTENTE);

        when(applicationStageRepository.findById(10L)).thenReturn(Optional.of(application));
        when(applicationStageRepository.existsByOffreDeStageIdAndStatutValidation(5L, StatutValidation.ACCEPTE)).thenReturn(false);
        when(applicationStageRepository.save(any(ApplicationStage.class))).thenAnswer(inv -> inv.getArgument(0));

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion = mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion = mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant)).thenReturn(etudiantDTO);
            offreConversion.when(() -> OffreDeStageDTO.of(offre)).thenReturn(offreDTO);

            ApplicationStageDTO resultat = applicationStageService.accepter(employeur, 10L);

            assertNotNull(resultat);
            assertEquals(StatutValidation.ACCEPTE, application.getStatutValidation());
            assertNull(application.getCommentaireRefus());
            assertNotNull(application.getDateDecision());

            verify(etudiant).setStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND);
            verify(utilisateurRepository).save(etudiant);
            verify(applicationStageRepository).save(application);
        }
    }

    @Test
    @DisplayName("accepter - lève BadRequestException si l'utilisateur n'est pas un employeur")
    void accepter_nonEmployeur() {
        assertThrows(BadRequestException.class, () -> applicationStageService.accepter(etudiant, 10L));
    }

    @Test
    @DisplayName("accepter - lève NotFoundException si la candidature n'existe pas")
    void accepter_candidatureIntrouvable() {
        when(applicationStageRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> applicationStageService.accepter(employeur, 99L));
    }

    @Test
    @DisplayName("accepter - lève NotFoundException si l'offre appartient à un autre employeur")
    void accepter_autreEmployeur() {
        Employeur autreEmployeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(2L);
        when(autreEmployeur.getId()).thenReturn(3L);
        when(offre.getUtilisateur()).thenReturn(autreEmployeur);

        ApplicationStage application = new ApplicationStage();
        application.setOffreDeStage(offre);

        when(applicationStageRepository.findById(10L)).thenReturn(Optional.of(application));

        assertThrows(NotFoundException.class, () -> applicationStageService.accepter(employeur, 10L));
    }

    @Test
    @DisplayName("accepter - lève BadRequestException si la candidature n'est plus EN_ATTENTE")
    void accepter_dejaTraitee() {
        when(employeur.getId()).thenReturn(2L);
        when(offre.getUtilisateur()).thenReturn(employeur);

        ApplicationStage application = new ApplicationStage();
        application.setOffreDeStage(offre);
        application.setStatutValidation(StatutValidation.REJETE);

        when(applicationStageRepository.findById(10L)).thenReturn(Optional.of(application));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> applicationStageService.accepter(employeur, 10L));
        assertEquals("Cette candidature a déjà été traitée.", ex.getMessage());
    }

    @Test
    @DisplayName("accepter - lève BadRequestException si l'offre a déjà été attribuée à un autre étudiant")
    void accepter_offreDejaAttribuee() {
        when(employeur.getId()).thenReturn(2L);
        when(offre.getUtilisateur()).thenReturn(employeur);
        when(offre.getId()).thenReturn(5L);

        ApplicationStage application = new ApplicationStage();
        application.setOffreDeStage(offre);
        application.setStatutValidation(StatutValidation.EN_ATTENTE);

        when(applicationStageRepository.findById(10L)).thenReturn(Optional.of(application));
        when(applicationStageRepository.existsByOffreDeStageIdAndStatutValidation(5L, StatutValidation.ACCEPTE)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> applicationStageService.accepter(employeur, 10L));
        assertEquals("Cette offre de stage a déjà été attribuée à un autre étudiant.", ex.getMessage());
    }


    @Test
    @DisplayName("refuser - succès : rejette la candidature avec un commentaire")
    void refuser_succes() throws Exception {
        when(employeur.getId()).thenReturn(2L);
        when(offre.getUtilisateur()).thenReturn(employeur);

        ApplicationStage application = new ApplicationStage();
        application.setId(10L);
        application.setEtudiant(etudiant);
        application.setOffreDeStage(offre);
        application.setStatutValidation(StatutValidation.EN_ATTENTE);

        when(applicationStageRepository.findById(10L)).thenReturn(Optional.of(application));
        when(applicationStageRepository.save(any(ApplicationStage.class))).thenAnswer(inv -> inv.getArgument(0));

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion = mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion = mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant)).thenReturn(etudiantDTO);
            offreConversion.when(() -> OffreDeStageDTO.of(offre)).thenReturn(offreDTO);

            ApplicationStageDTO resultat = applicationStageService.refuser(employeur, 10L, " Profil insuffisant ");

            assertNotNull(resultat);
            assertEquals(StatutValidation.REJETE, application.getStatutValidation());
            assertEquals("Profil insuffisant", application.getCommentaireRefus());
            assertNotNull(application.getDateDecision());
            verify(applicationStageRepository).save(application);
        }
    }

    @Test
    @DisplayName("refuser - lève BadRequestException si le commentaire est vide ou null")
    void refuser_commentaireInvalide() {
        assertThrows(BadRequestException.class, () -> applicationStageService.refuser(employeur, 10L, null));
        assertThrows(BadRequestException.class, () -> applicationStageService.refuser(employeur, 10L, "   "));
    }

    @Test
    @DisplayName("findApplicationsForStudent - lève IllegalStateException si l'offre liée est introuvable")
    void findApplicationsForStudent_offreIntrouvable() {
        when(etudiant.getId()).thenReturn(1L);
        ApplicationStage app = mock(ApplicationStage.class);
        when(app.getOffreDeStage()).thenReturn(offre);
        when(offre.getId()).thenReturn(99L);
        when(applicationStageRepository.findByEtudiantId(1L)).thenReturn(List.of(app));
        when(documentRepository.findOffreStageSummaryById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> applicationStageService.findApplicationsForStudent(etudiant));
    }

    @Test
    @DisplayName("toDto - inclut les infos du CV et le statut hasInterview si présents")
    void toDto_avecCvEtEntrevue() {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);

        ApplicationStage app = mock(ApplicationStage.class);
        when(app.getId()).thenReturn(10L);
        when(app.getDateApplique()).thenReturn(LocalDate.of(2026, 10, 16));
        when(app.getEtudiant()).thenReturn(etudiant);
        when(app.getOffreDeStage()).thenReturn(offre);
        when(app.getStatutValidation()).thenReturn(StatutValidation.EN_ATTENTE);
        when(app.getCommentaireRefus()).thenReturn(null);

        CV cv = mock(CV.class);
        when(cv.getId()).thenReturn(100L);
        when(cv.getFileName()).thenReturn("mon_cv.pdf");
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(cv);
        when(entrevueRepository.existsByStudentIdAndInternshipOfferId(1L, 5L)).thenReturn(true);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion = mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion = mockStatic(OffreDeStageDTO.class)) {

            etudiantConversion.when(() -> EtudiantDTO.of(etudiant)).thenReturn(etudiantDTO);
            offreConversion.when(() -> OffreDeStageDTO.of(offre)).thenReturn(offreDTO);

            ApplicationStageDTO resultat = applicationStageService.toDto(app);

            assertEquals(100L, resultat.cvDocumentId());
            assertEquals("mon_cv.pdf", resultat.cvFileName());
            assertTrue(resultat.interviewScheduled());
        }
    }

    @Test
    @DisplayName("listerOffresParSession - filtre correctement les offres selon la session")
    void listerOffresParSession_filtre() {
        LocalDateTime dateAutomne = LocalDateTime.of(2026, 10, 1, 10, 0);
        LocalDateTime dateHiver = LocalDateTime.of(2026, 2, 1, 10, 0);

        OffreDeStageDTO offreAutomne = new OffreDeStageDTO(
                1L, "o1.pdf", "a@mail.com", "Ent1", "Dev", "Desc",
                null, null, "Mtl", StatutValidation.VALIDE, null, 25.0,
                Disciplines.INFORMATIQUE, null, null, 1, dateAutomne
        );

        OffreDeStageDTO offreHiver = new OffreDeStageDTO(
                2L, "o2.pdf", "b@mail.com", "Ent2", "Dev", "Desc",
                null, null, "Mtl", StatutValidation.VALIDE, null, 25.0,
                Disciplines.INFORMATIQUE, null, null, 1, dateHiver
        );

        OffreDeStageDTO offreSansDate = new OffreDeStageDTO(
                3L, "o3.pdf", "c@mail.com", "Ent3", "Dev", "Desc",
                null, null, "Mtl", StatutValidation.VALIDE, null, 25.0,
                Disciplines.INFORMATIQUE, null, null, 1, null
        );

        when(documentRepository.findAllOffreStageSummaries()).thenReturn(List.of(offreAutomne, offreHiver, offreSansDate));

        List<OffreDeStageDTO> resultat = applicationStageService.listerOffresParSession("A26");

        assertEquals(1, resultat.size());
        assertEquals(1L, resultat.getFirst().id());
    }
}