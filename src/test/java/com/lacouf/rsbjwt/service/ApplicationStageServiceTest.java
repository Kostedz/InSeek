package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationStageServiceTest {

    @Mock
    private ApplicationStageRepository applicationStageRepository;

    @InjectMocks
    private ApplicationStageService applicationStageService;

    private Etudiant etudiant;
    private OffreDeStage offre;

    @BeforeEach
    void setUp() {
        etudiant = mock(Etudiant.class);
        offre = mock(OffreDeStage.class);
    }

    @Test
    @DisplayName("Un étudiant peut postuler et reçoit le DTO de sa candidature")
    void createApplicationStage_succes() throws Exception {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);
        when(applicationStageRepository.existsByEtudiantIdAndOffreDeStageId(1L, 5L))
                .thenReturn(false);
        when(applicationStageRepository.save(any(ApplicationStage.class)))
                .thenAnswer(invocation -> {
                    ApplicationStage application = invocation.getArgument(0);
                    application.setId(10L);
                    return application;
                });

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion = mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion = mockStatic(OffreDeStageDTO.class)) {
            etudiantConversion.when(() -> EtudiantDTO.of(etudiant)).thenReturn(etudiantDTO);
            offreConversion.when(() -> OffreDeStageDTO.of(offre)).thenReturn(offreDTO);

            ApplicationStageDTO resultat = applicationStageService.createApplicationStage(etudiant, offre);

            assertNotNull(resultat);
            assertEquals(10L, resultat.id());
            assertEquals(LocalDate.now(), resultat.dateApplique());
            assertSame(etudiantDTO, resultat.etudiantDTO());
            assertSame(offreDTO, resultat.offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE, resultat.statutValidation());

            var captor = org.mockito.ArgumentCaptor.forClass(ApplicationStage.class);
            verify(applicationStageRepository).save(captor.capture());
            assertSame(etudiant, captor.getValue().getEtudiant());
            assertSame(offre, captor.getValue().getOffreDeStage());
            verify(applicationStageRepository).existsByEtudiantIdAndOffreDeStageId(1L, 5L);
        }
    }

    @Test
    @DisplayName("Un utilisateur qui n'est pas étudiant ne peut pas postuler")
    void createApplicationStage_nonEtudiant_refuse() {
        Utilisateur employeur = mock(Employeur.class);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage(employeur, offre));

        verifyNoInteractions(applicationStageRepository);
    }

    @Test
    @DisplayName("Un étudiant ne peut pas postuler deux fois à la même offre")
    void createApplicationStage_doublon_refuse() {
        when(etudiant.getId()).thenReturn(1L);
        when(offre.getId()).thenReturn(5L);
        when(applicationStageRepository.existsByEtudiantIdAndOffreDeStageId(1L, 5L))
                .thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> applicationStageService.createApplicationStage(etudiant, offre));

        verify(applicationStageRepository, never()).save(any(ApplicationStage.class));
    }

    @Test
    @DisplayName("toDto convertit correctement les champs de la candidature")
    void toDto_convertitApplication() {
        ApplicationStage application = new ApplicationStage();
        application.setId(42L);
        application.setDateApplique(LocalDate.of(2026, 10, 16));
        application.setEtudiant(etudiant);
        application.setOffreDeStage(offre);
        application.setStatutValidation(StatutValidation.EN_ATTENTE);

        EtudiantDTO etudiantDTO = mock(EtudiantDTO.class);
        OffreDeStageDTO offreDTO = mock(OffreDeStageDTO.class);

        try (MockedStatic<EtudiantDTO> etudiantConversion = mockStatic(EtudiantDTO.class);
             MockedStatic<OffreDeStageDTO> offreConversion = mockStatic(OffreDeStageDTO.class)) {
            etudiantConversion.when(() -> EtudiantDTO.of(etudiant)).thenReturn(etudiantDTO);
            offreConversion.when(() -> OffreDeStageDTO.of(offre)).thenReturn(offreDTO);

            ApplicationStageDTO resultat = applicationStageService.toDto(application);

            assertEquals(42L, resultat.id());
            assertEquals(LocalDate.of(2026, 10, 16), resultat.dateApplique());
            assertSame(etudiantDTO, resultat.etudiantDTO());
            assertSame(offreDTO, resultat.offreDeStageDTO());
            assertEquals(StatutValidation.EN_ATTENTE, resultat.statutValidation());
        }
    }
}
