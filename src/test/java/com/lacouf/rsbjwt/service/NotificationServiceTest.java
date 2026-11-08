package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock ContratRepository contratRepository;
    @Mock EvaluationStagiaireRepository evaluationRepository;
    @Mock CourrielService courrielService;
    @InjectMocks NotificationService service;

    private Employeur employeur;
    private Etudiant etudiant;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "alertDays", 21);
        employeur = Employeur.builder().id(1L).nom("Soft").prenom("Ubi")
                .email("ubisoft@mail.com").password("x").nomCompagnie("UbiSoft").build();
        etudiant = Etudiant.builder().id(2L).nom("Étudiant").prenom("Demo")
                .email("demo@inseek.local").password("x").discipline(Disciplines.INFORMATIQUE).build();
    }

    // ---------- helpers ----------

    private Contract contrat(Long id, Employeur employer) {
        Contract c = Contract.builder()
                .employer(employer)
                .student(etudiant)
                .endingDate(LocalDate.now().plusDays(15))
                .contractStatus(StatutContrat.SIGNED_BY_GESTIONNAIRE)
                .build();
        c.setId(id);
        return c;
    }

    private void contratsTrouves(Contract... contrats) {
        when(contratRepository.findByContractStatusInAndEndingDateBetween(any(), any(), any()))
                .thenReturn(List.of(contrats));
    }

    private Notification notificationDe(String email) {
        Employeur dest = Employeur.builder().id(1L).nom("Soft").prenom("Ubi")
                .email(email).password("x").nomCompagnie("UbiSoft").build();
        Notification n = new Notification();
        n.setId(5L);
        n.setDestinataire(dest);
        n.setType(TypeNotification.EVALUATION_STAGIAIRE);
        n.setMessage("Message");
        return n;
    }

    // ---------- alerterEvaluationsStagiaires ----------

    @Test
    void creeNotificationEtCourrielQuandEvaluationAbsente() {
        contratsTrouves(contrat(10L, employeur));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);
        when(notificationRepository.existsByTypeAndContratId(TypeNotification.EVALUATION_STAGIAIRE, 10L))
                .thenReturn(false);

        assertEquals(1, service.alerterEvaluationsStagiaires());

        verify(notificationRepository).save(any(Notification.class));
        verify(courrielService).envoyer(eq("ubisoft@mail.com"), anyString(), anyString());
    }

    @Test
    void neNotifiePasSiEvaluationDejaRemplie() {
        contratsTrouves(contrat(10L, employeur));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    void neCreePasDeDoublon() {
        contratsTrouves(contrat(10L, employeur));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);
        when(notificationRepository.existsByTypeAndContratId(TypeNotification.EVALUATION_STAGIAIRE, 10L))
                .thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    void ignoreUnContratSansEmployeur() {
        contratsTrouves(contrat(11L, null));

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    void utiliseLaFenetreDeVingtEtUnJours() {
        when(contratRepository.findByContractStatusInAndEndingDateBetween(any(), any(), any()))
                .thenReturn(List.of());

        assertEquals(0, service.alerterEvaluationsStagiaires());

        LocalDate today = LocalDate.now();
        verify(contratRepository).findByContractStatusInAndEndingDateBetween(
                any(), eq(today), eq(today.plusDays(21)));
    }

    // ---------- lister / compterNonLues ----------

    @Test
    void listeLesNotificationsDeLUtilisateur() {
        when(notificationRepository.findByDestinataireEmail("ubisoft@mail.com"))
                .thenReturn(List.of(notificationDe("ubisoft@mail.com")));

        List<NotificationDTO> result = service.lister("ubisoft@mail.com");

        assertEquals(1, result.size());
        assertEquals("Message", result.get(0).message());
    }

    @Test
    void compteLesNonLues() {
        when(notificationRepository.countNonLuesByEmail("ubisoft@mail.com")).thenReturn(3L);

        assertEquals(3L, service.compterNonLues("ubisoft@mail.com"));
    }

    // ---------- marquerLue ----------

    @Test
    void marqueUneNotificationCommeLue() throws Exception {
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationDe("ubisoft@mail.com")));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(i -> i.getArgument(0));

        NotificationDTO dto = service.marquerLue(5L, "UBISOFT@mail.com");

        assertTrue(dto.lue());
    }

    @Test
    void refuseSiNotificationInexistante() {
        when(notificationRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.marquerLue(9L, "ubisoft@mail.com"));
    }

    @Test
    void refuseSiAutreDestinataire() {
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationDe("autre@mail.com")));

        assertThrows(NotFoundException.class, () -> service.marquerLue(5L, "ubisoft@mail.com"));
        verify(notificationRepository, never()).save(any());
    }
}