package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.EvaluationStagiaireDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluationStagiaireServiceTest {

    @Mock EvaluationStagiaireRepository evaluationRepository;
    @Mock ContratRepository contratRepository;
    @Mock UtilisateurRepository utilisateurRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock NotificationService notificationService;
    @InjectMocks EvaluationStagiaireService service;

    private Employeur employeur;
    private Professeur professeur;
    private Etudiant etudiant;
    private Contract contrat;

    @BeforeEach
    void setUp() {
        employeur = Employeur.builder().id(1L).nom("Soft").prenom("Ubi")
                .email("ubisoft@mail.com").password("x").nomCompagnie("UbiSoft").build();
        professeur = Professeur.builder().id(7L).nom("Gagnon").prenom("Bob")
                .email("bob@mail.com").password("x").discipline(Disciplines.INFORMATIQUE).build();
        etudiant = Etudiant.builder().id(2L).nom("E").prenom("D")
                .email("demo@inseek.local").password("x").discipline(Disciplines.INFORMATIQUE).build();
        etudiant.setProfesseur(professeur);
        contrat = Contract.builder().employer(employeur).student(etudiant).build();
        contrat.setId(10L);
    }

    // soumettre

    @Test
    void soumetUneEvaluationMarqueLesNotificationsLuesEtNotifieLeProfesseur() throws Exception {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(contratRepository.findById(10L)).thenReturn(Optional.of(contrat));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);

        service.soumettre(10L, "  Très bon stagiaire  ", "ubisoft@mail.com");

        verify(evaluationRepository).save(any(EvaluationStagiaire.class));
        verify(notificationRepository).marquerLuesPourContrat(10L, TypeNotification.EVALUATION_STAGIAIRE);
        verify(notificationService).notifierProfesseurNouvelleEvaluation(contrat);
    }

    @Test
    void refuseUnCommentaireVide() {
        assertThrows(BadRequestException.class, () -> service.soumettre(10L, "  ", "ubisoft@mail.com"));
        assertThrows(BadRequestException.class, () -> service.soumettre(10L, null, "ubisoft@mail.com"));
        verifyNoInteractions(notificationService);
    }

    @Test
    void refuseUnUtilisateurQuiNEstPasEmployeur() {
        when(utilisateurRepository.findByEmail("demo@inseek.local")).thenReturn(etudiant);

        assertThrows(BadRequestException.class, () -> service.soumettre(10L, "ok", "demo@inseek.local"));
    }

    @Test
    void refuseUnContratInexistant() {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(contratRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.soumettre(10L, "ok", "ubisoft@mail.com"));
    }

    @Test
    void refuseLeContratDUnAutreEmployeur() {
        Employeur autre = Employeur.builder().id(99L).nom("A").prenom("B")
                .email("autre@mail.com").password("x").nomCompagnie("Autre").build();
        when(utilisateurRepository.findByEmail("autre@mail.com")).thenReturn(autre);
        when(contratRepository.findById(10L)).thenReturn(Optional.of(contrat));

        assertThrows(NotFoundException.class, () -> service.soumettre(10L, "ok", "autre@mail.com"));
    }

    @Test
    void refuseUneDeuxiemeEvaluation() {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(contratRepository.findById(10L)).thenReturn(Optional.of(contrat));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.soumettre(10L, "ok", "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
        verify(notificationService, never()).notifierProfesseurNouvelleEvaluation(any());
    }

    // consulterpourProfesseur

    private EvaluationStagiaire evaluation() {
        EvaluationStagiaire e = new EvaluationStagiaire();
        e.setId(5L);
        e.setContrat(contrat);
        e.setEmployeur(employeur);
        e.setCommentaire("Très bon stagiaire");
        return e;
    }

    @Test
    void leProfesseurAssigneConsulteLEvaluation() throws Exception {
        when(evaluationRepository.findByContratId(10L)).thenReturn(Optional.of(evaluation()));

        EvaluationStagiaireDTO dto = service.consulterPourProfesseur(10L, "BOB@mail.com");

        assertEquals(10L, dto.contratId());
        assertEquals("UbiSoft", dto.entreprise());
        assertEquals("Très bon stagiaire", dto.commentaire());
    }

    @Test
    void refuseLaConsultationParUnAutreProfesseur() {
        when(evaluationRepository.findByContratId(10L)).thenReturn(Optional.of(evaluation()));

        assertThrows(NotFoundException.class,
                () -> service.consulterPourProfesseur(10L, "lise@mail.com"));
    }

    @Test
    void refuseLaConsultationSiAucunProfesseurAssigne() {
        etudiant.setProfesseur(null);
        when(evaluationRepository.findByContratId(10L)).thenReturn(Optional.of(evaluation()));

        assertThrows(NotFoundException.class,
                () -> service.consulterPourProfesseur(10L, "bob@mail.com"));
    }

    @Test
    void refuseLaConsultationDUneEvaluationInexistante() {
        when(evaluationRepository.findByContratId(10L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.consulterPourProfesseur(10L, "bob@mail.com"));
    }
}