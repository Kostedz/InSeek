package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluationStagiaireServiceTest {

    @Mock EvaluationStagiaireRepository evaluationRepository;
    @Mock ContratRepository contratRepository;
    @Mock UtilisateurRepository utilisateurRepository;
    @Mock NotificationRepository notificationRepository;
    @InjectMocks EvaluationStagiaireService service;

    private Employeur employeur;
    private Contract contrat;

    @BeforeEach
    void setUp() {
        employeur = Employeur.builder().id(1L).nom("Soft").prenom("Ubi")
                .email("ubisoft@mail.com").password("x").nomCompagnie("UbiSoft").build();
        contrat = Contract.builder().employer(employeur).build();
        contrat.setId(10L);
    }

    @Test
    void soumetUneEvaluationEtMarqueLesNotificationsLues() throws Exception {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(contratRepository.findById(10L)).thenReturn(Optional.of(contrat));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(false);

        service.soumettre(10L, "  Très bon stagiaire  ", "ubisoft@mail.com");

        verify(evaluationRepository).save(any(EvaluationStagiaire.class));
        verify(notificationRepository).marquerLuesPourContrat(10L, TypeNotification.EVALUATION_STAGIAIRE);
    }

    @Test
    void refuseUnCommentaireVide() {
        assertThrows(BadRequestException.class, () -> service.soumettre(10L, "  ", "ubisoft@mail.com"));
        assertThrows(BadRequestException.class, () -> service.soumettre(10L, null, "ubisoft@mail.com"));
    }

    @Test
    void refuseUnUtilisateurQuiNEstPasEmployeur() {
        Etudiant etudiant = Etudiant.builder().id(2L).nom("E").prenom("D")
                .email("demo@inseek.local").password("x").discipline(Disciplines.INFORMATIQUE).build();
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
    }
}