package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
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

import java.time.LocalDate;
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

    @InjectMocks
    private ApplicationStageService applicationStageService;

    private Etudiant etudiant;
    private Employeur employeur;
    private OffreDeStage offre;

    @BeforeEach
    void setUp() {
        etudiant = mock(Etudiant.class);
        employeur = mock(Employeur.class);
        offre = mock(OffreDeStage.class);
    }

    // --------------------------------------------------
    // CREATE APPLICATION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FIND APPLIED OFFER IDS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FIND APPLICATIONS FOR STUDENT
    // --------------------------------------------------

    @Test
    @DisplayName("Un étudiant peut consulter ses candidatures")
    void findApplicationsForStudent_succes() throws Exception {
        when(etudiant.getId()).thenReturn(1L);

        ApplicationStage application = mock(ApplicationStage.class);
        when(application.getId()).thenReturn(10L);
        when(application.getDateApplique()).thenReturn(LocalDate.of(2026, 10, 16));
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
            assertEquals(10L, resultat.get(0).id());
            assertSame(etudiantDTO, resultat.get(0).etudiantDTO());
            assertSame(offreDTO, resultat.get(0).offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE,
                    resultat.get(0).statutValidation());
        }
    }

    @Test
    @DisplayName("Un employeur ne peut pas consulter les candidatures d'un étudiant")
    void findApplicationsForStudent_nonEtudiant() {
        assertThrows(BadRequestException.class,
                () -> applicationStageService.findApplicationsForStudent(employeur));

        verifyNoInteractions(applicationStageRepository);
    }

    // --------------------------------------------------
    // FIND APPLICATIONS FOR EMPLOYER
    // --------------------------------------------------

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
            assertEquals(10L, resultat.get(0).id());
            assertSame(etudiantDTO, resultat.get(0).etudiantDTO());
            assertSame(offreDTO, resultat.get(0).offreDeStageDTO());
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

    // --------------------------------------------------
    // FIND STUDENTS BY OFFER
    // --------------------------------------------------

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
            assertSame(etudiantDTO, resultat.get(0));
        }
    }

    // --------------------------------------------------
    // DTO CONVERSION
    // --------------------------------------------------

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
}