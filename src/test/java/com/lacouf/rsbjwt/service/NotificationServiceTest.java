package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock ContratRepository contratRepository;
    @Mock EvaluationStagiaireRepository evaluationRepository;
    @Mock CourrielService courrielService;
    @InjectMocks NotificationService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "alertDays", 21);
        Employeur employeur = Employeur.builder().id(1L).nom("Soft").prenom("Ubi")
                .email("ubisoft@mail.com").password("x").nomCompagnie("UbiSoft").build();
        Etudiant etudiant = Etudiant.builder().id(2L).nom("Étudiant").prenom("Demo")
                .email("demo@inseek.local").password("x").discipline(Disciplines.INFORMATIQUE).build();
        Contract contrat = Contract.builder().employer(employeur).student(etudiant)
                .endingDate(LocalDate.now().plusDays(15))
                .contractStatus(StatutContrat.SIGNED_BY_GESTIONNAIRE).build();
        contrat.setId(10L);
        when(contratRepository.findByContractStatusInAndEndingDateBetween(any(), any(), any()))
                .thenReturn(List.of(contrat));
    }

    @Test
    void creeNotificationEtCourrielQuandEvaluationAbsente() {
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);
        when(notificationRepository.existsByTypeAndContratId(TypeNotification.EVALUATION_STAGIAIRE, 10L))
                .thenReturn(false);

        assertEquals(1, service.alerterEvaluationsStagiaires());
        verify(notificationRepository).save(any(Notification.class));
        verify(courrielService).envoyer(eq("ubisoft@mail.com"), anyString(), anyString());
    }

    @Test
    void neNotifiePasSiEvaluationDejaRemplie() {
        when(evaluationRepository.existsByContratId(10L)).thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());
        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    void neCreePasDeDoublon() {
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);
        when(notificationRepository.existsByTypeAndContratId(TypeNotification.EVALUATION_STAGIAIRE, 10L))
                .thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void utiliseLaFenetreDeVingtEtUnJours() {
        when(evaluationRepository.existsByContratId(10L)).thenReturn(true);

        service.alerterEvaluationsStagiaires();

        LocalDate today = LocalDate.now();
        verify(contratRepository).findByContractStatusInAndEndingDateBetween(
                any(), eq(today), eq(today.plusDays(21)));
    }
}