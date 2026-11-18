
package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationStagiaireRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.PreferenceNotificationRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import com.lacouf.rsbjwt.service.dto.PreferencesNotificationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
@DisplayName("Tests du service de notifications")
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock ContratRepository contratRepository;
    @Mock EvaluationStagiaireRepository evaluationRepository;
    @Mock PreferenceNotificationRepository preferenceRepository;
    @Mock UtilisateurRepository utilisateurRepository;
    @Mock CourrielService courrielService;

    @InjectMocks NotificationService service;

    private Employeur employeur;
    private Etudiant etudiant;
    private Gestionnaire gestionnaire;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "alertDays", 21);
        ReflectionTestUtils.setField(service, "maxTentatives", 5);
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(service, "contractPath", "/contrats/{id}");

        employeur = Employeur.builder()
                .id(1L).nom("Soft").prenom("Ubi")
                .email("ubisoft@mail.com").password("x")
                .nomCompagnie("UbiSoft").build();

        etudiant = Etudiant.builder()
                .id(2L).nom("Étudiant").prenom("Demo")
                .email("demo@inseek.local").password("x")
                .discipline(Disciplines.INFORMATIQUE).build();

        gestionnaire = Gestionnaire.builder()
                .id(3L).nom("Admin").prenom("Jean")
                .email("gestionnaire@inseek.com").password("x").build();
    }

    // ---------- Helpers ----------

    private Contract contrat(Long id, Employeur employer) {
        Contract c = Contract.builder()
                .employer(employer)
                .student(etudiant)
                .admin(gestionnaire)
                .startingDate(LocalDate.now().plusDays(1))
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

    private void courrielOk() {
        when(courrielService.envoyer(anyString(), anyString(), anyString())).thenReturn(true);
    }

    private void courrielEnPanne() {
        when(courrielService.envoyer(anyString(), anyString(), anyString())).thenReturn(false);
    }

    private Notification notificationDe(String email) {
        Employeur dest = Employeur.builder()
                .id(1L).nom("Soft").prenom("Ubi")
                .email(email).password("x")
                .nomCompagnie("UbiSoft").build();

        Notification n = new Notification();
        n.setId(5L);
        n.setDestinataire(dest);
        n.setType(TypeNotification.EVALUATION_STAGIAIRE);
        n.setMessage("Message");
        return n;
    }

    private List<Notification> notificationsSauvegardees() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues();
    }

    // ---------- Alertes d'évaluation des stagiaires ----------

    @Test
    @DisplayName("Crée une notification et un courriel lorsqu'une évaluation est absente")
    void creeNotificationEtCourrielQuandEvaluationAbsente() {
        contratsTrouves(contrat(10L, employeur));
        courrielOk();

        assertEquals(1, service.alerterEvaluationsStagiaires());

        verify(notificationRepository).save(any(Notification.class));
        verify(courrielService).envoyer(eq("ubisoft@mail.com"), anyString(), anyString());
    }

    @Test
    @DisplayName("Ne notifie pas si l'évaluation est déjà remplie")
    void neNotifiePasSiEvaluationDejaRemplie() {
        contratsTrouves(contrat(10L, employeur));
        when(evaluationRepository.existsByContratId(10L)).thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    @DisplayName("Ne crée pas de doublon pour une évaluation")
    void neCreePasDeDoublonPourLEvaluation() {
        contratsTrouves(contrat(10L, employeur));
        when(notificationRepository.existsByTypeAndContratId(
                TypeNotification.EVALUATION_STAGIAIRE, 10L)).thenReturn(true);

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    @DisplayName("Ignore un contrat sans employeur")
    void ignoreUnContratSansEmployeur() {
        contratsTrouves(contrat(11L, null));

        assertEquals(0, service.alerterEvaluationsStagiaires());

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    @DisplayName("Utilise une fenêtre de vingt et un jours")
    void utiliseLaFenetreDeVingtEtUnJours() {
        when(contratRepository.findByContractStatusInAndEndingDateBetween(any(), any(), any()))
                .thenReturn(List.of());

        assertEquals(0, service.alerterEvaluationsStagiaires());

        LocalDate today = LocalDate.now();
        verify(contratRepository).findByContractStatusInAndEndingDateBetween(
                any(), eq(today), eq(today.plusDays(21)));
    }

    // ---------- Nouveau contrat ----------

    @Test
    @DisplayName("Notifie l'étudiant et l'employeur d'un nouveau contrat")
    void notifieLEtudiantEtLEmployeurDUnNouveauContrat() {
        courrielOk();

        assertEquals(2, service.notifierNouveauContrat(contrat(20L, employeur)));

        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(courrielService).envoyer(eq("demo@inseek.local"), anyString(), anyString());
        verify(courrielService).envoyer(eq("ubisoft@mail.com"), anyString(), anyString());
    }

    @Test
    @DisplayName("Enregistre le lien, le statut et la date d'envoi")
    void enregistreLeLienLeStatutEtLHorodatageDEnvoi() {
        courrielOk();

        service.notifierNouveauContrat(contrat(20L, employeur));

        Notification n = notificationsSauvegardees().get(0);
        assertEquals(TypeNotification.NOUVEAU_CONTRAT, n.getType());
        assertEquals("http://localhost:3000/contrats/20", n.getLien());
        assertEquals(StatutEnvoiCourriel.ENVOYE, n.getStatutCourriel());
        assertNotNull(n.getDateEnvoi());
        assertEquals(1, n.getTentatives());
        assertTrue(n.getMessage().contains("UbiSoft"));
        assertTrue(n.isInApp());
    }

    @Test
    @DisplayName("Ne crée pas de doublon pour un nouveau contrat")
    void neCreePasDeDoublonPourUnNouveauContrat() {
        when(notificationRepository.existsByTypeAndContratIdAndDestinataireId(
                eq(TypeNotification.NOUVEAU_CONTRAT), eq(20L), any())).thenReturn(true);

        assertEquals(0, service.notifierNouveauContrat(contrat(20L, employeur)));

        verify(notificationRepository, never()).save(any());
        verifyNoInteractions(courrielService);
    }

    @Test
    @DisplayName("Notifie seulement l'étudiant si aucun employeur n'est associé")
    void notifieSeulementLEtudiantSiPasDEmployeur() {
        courrielOk();

        assertEquals(1, service.notifierNouveauContrat(contrat(21L, null)));

        verify(courrielService, times(1)).envoyer(eq("demo@inseek.local"), anyString(), anyString());
    }

    @Test
    @DisplayName("Envoie le courriel même si les notifications In-App sont désactivées")
    void envoieLeCourrielMemeSiLInAppEstDesactive() {
        PreferenceNotification pref = new PreferenceNotification();
        pref.setInAppActif(false);
        when(preferenceRepository.findByUtilisateurId(2L)).thenReturn(Optional.of(pref));
        courrielOk();

        service.notifierNouveauContrat(contrat(22L, null));

        Notification n = notificationsSauvegardees().get(0);
        assertFalse(n.isInApp());
        verify(courrielService).envoyer(eq("demo@inseek.local"), anyString(), anyString());
    }

    @Test
    @DisplayName("Marque l'échec et alerte le gestionnaire si le courriel échoue")
    void marqueEchecEtAlerteLeGestionnaireSiLeCourrielEchoue() {
        courrielEnPanne();

        service.notifierNouveauContrat(contrat(23L, null));

        List<Notification> sauvegardees = notificationsSauvegardees();
        Notification contratNotif = sauvegardees.stream()
                .filter(n -> n.getType() == TypeNotification.NOUVEAU_CONTRAT)
                .findFirst().orElseThrow();

        assertEquals(StatutEnvoiCourriel.ECHEC, contratNotif.getStatutCourriel());
        assertTrue(contratNotif.isInApp());
        assertTrue(sauvegardees.stream().anyMatch(n ->
                n.getType() == TypeNotification.ECHEC_COURRIEL && n.getDestinataire() == gestionnaire));
    }

    @Test
    @DisplayName("Ne crée pas une deuxième alerte pour le gestionnaire")
    void neCreePasDeSecondeAlerteGestionnaire() {
        courrielEnPanne();
        when(notificationRepository.existsByTypeAndContratIdAndDestinataireId(
                TypeNotification.ECHEC_COURRIEL, 24L, 3L)).thenReturn(true);

        service.notifierNouveauContrat(contrat(24L, null));

        assertTrue(notificationsSauvegardees().stream()
                .noneMatch(n -> n.getType() == TypeNotification.ECHEC_COURRIEL));
    }

    @Test
    @DisplayName("Ne provoque pas d'erreur si aucun gestionnaire n'est associé")
    void echecSansGestionnaireNeLevePasDErreur() {
        courrielEnPanne();
        Contract c = contrat(25L, null);
        c.setAdmin(null);

        assertEquals(1, service.notifierNouveauContrat(c));
    }

    @Test
    @DisplayName("Notifie les utilisateurs d'une nouvelle version du contrat")
    void notifieUneNouvelleVersionDuContrat() {
        courrielOk();

        assertEquals(2, service.notifierContratRevise(contrat(26L, employeur)));

        Notification n = notificationsSauvegardees().get(0);
        assertEquals(TypeNotification.CONTRAT_REVISE, n.getType());
        assertTrue(n.getMessage().contains("nouvelle version"));
    }

    @Test
    @DisplayName("Utilise des valeurs par défaut lorsque les dates sont absentes")
    void contratSansDatesNiOffreUtiliseDesValeursParDefaut() {
        courrielOk();
        Contract c = contrat(27L, employeur);
        c.setStartingDate(null);
        c.setEndingDate(null);

        service.notifierNouveauContrat(c);

        assertTrue(notificationsSauvegardees().get(0).getMessage().contains("dates à confirmer"));
    }

    // ---------- Reprise des courriels ----------

    @Test
    @DisplayName("Réessaie les courriels en échec et les marque comme envoyés")
    void reessaieLesCourrielsEnEchecEtLesMarqueEnvoyes() {
        Notification n = notificationDe("ubisoft@mail.com");
        n.setSujetCourriel("Sujet");
        n.setCorpsCourriel("Corps");
        n.setStatutCourriel(StatutEnvoiCourriel.ECHEC);
        n.setTentatives(1);

        when(notificationRepository.findByStatutCourrielAndTentativesLessThan(
                StatutEnvoiCourriel.ECHEC, 5)).thenReturn(List.of(n));
        courrielOk();

        assertEquals(1, service.reessayerCourriels());

        assertEquals(StatutEnvoiCourriel.ENVOYE, n.getStatutCourriel());
        assertEquals(2, n.getTentatives());
    }

    @Test
    @DisplayName("Conserve le statut d'échec si le courriel ne peut toujours pas être envoyé")
    void laRepriseGardeLEchecSiLeServiceEstToujoursEnPanne() {
        Notification n = notificationDe("ubisoft@mail.com");
        n.setSujetCourriel("Sujet");
        n.setCorpsCourriel("Corps");
        n.setStatutCourriel(StatutEnvoiCourriel.ECHEC);

        when(notificationRepository.findByStatutCourrielAndTentativesLessThan(
                StatutEnvoiCourriel.ECHEC, 5)).thenReturn(List.of(n));
        courrielEnPanne();

        assertEquals(0, service.reessayerCourriels());

        assertEquals(StatutEnvoiCourriel.ECHEC, n.getStatutCourriel());
        assertEquals(1, n.getTentatives());
    }

    @Test
    @DisplayName("Ne fait rien lorsqu'aucun courriel n'est en échec")
    void laRepriseNeFaitRienSiAucunEchec() {
        when(notificationRepository.findByStatutCourrielAndTentativesLessThan(
                StatutEnvoiCourriel.ECHEC, 5)).thenReturn(List.of());

        assertEquals(0, service.reessayerCourriels());

        verifyNoInteractions(courrielService);
    }

    // ---------- Lecture des notifications ----------

    @Test
    @DisplayName("Retourne les notifications de l'utilisateur")
    void listeLesNotificationsDeLUtilisateur() {
        when(notificationRepository.findByDestinataireEmail("ubisoft@mail.com"))
                .thenReturn(List.of(notificationDe("ubisoft@mail.com")));

        List<NotificationDTO> result = service.lister("ubisoft@mail.com");

        assertEquals(1, result.size());
        assertEquals("Message", result.get(0).message());
    }

    @Test
    @DisplayName("Retourne le nombre de notifications non lues")
    void compteLesNonLues() {
        when(notificationRepository.countNonLuesByEmail("ubisoft@mail.com")).thenReturn(3L);

        assertEquals(3L, service.compterNonLues("ubisoft@mail.com"));
    }

    @Test
    @DisplayName("Marque une notification comme lue")
    void marqueUneNotificationCommeLue() throws Exception {
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationDe("ubisoft@mail.com")));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(i -> i.getArgument(0));

        assertTrue(service.marquerLue(5L, "UBISOFT@mail.com").lue());
    }

    @Test
    @DisplayName("Refuse de marquer une notification inexistante comme lue")
    void refuseSiNotificationInexistante() {
        when(notificationRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.marquerLue(9L, "ubisoft@mail.com"));
    }

    @Test
    @DisplayName("Refuse de modifier une notification appartenant à un autre utilisateur")
    void refuseSiAutreDestinataire() {
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationDe("autre@mail.com")));

        assertThrows(NotFoundException.class,
                () -> service.marquerLue(5L, "ubisoft@mail.com"));
        verify(notificationRepository, never()).save(any());
    }

    // ---------- Préférences de notification ----------

    @Test
    @DisplayName("Active les notifications In-App par défaut")
    void lesPreferencesParDefautActiventLInApp() throws Exception {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(preferenceRepository.findByUtilisateurId(1L)).thenReturn(Optional.empty());

        PreferencesNotificationDTO dto = service.preferences("ubisoft@mail.com");

        assertTrue(dto.inAppActif());
    }

    @Test
    @DisplayName("Retourne les préférences de notification enregistrées")
    void lesPreferencesRetournentLaValeurEnregistree() throws Exception {
        PreferenceNotification pref = new PreferenceNotification();
        pref.setInAppActif(false);

        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(preferenceRepository.findByUtilisateurId(1L)).thenReturn(Optional.of(pref));

        assertFalse(service.preferences("ubisoft@mail.com").inAppActif());
    }

    @Test
    @DisplayName("Modifie les préférences en créant une entrée si elle est absente")
    void modifieLesPreferencesEnCreantLaLigneSiAbsente() throws Exception {
        when(utilisateurRepository.findByEmail("ubisoft@mail.com")).thenReturn(employeur);
        when(preferenceRepository.findByUtilisateurId(1L)).thenReturn(Optional.empty());

        PreferencesNotificationDTO dto = service.modifierPreferences("ubisoft@mail.com", false);

        assertFalse(dto.inAppActif());

        ArgumentCaptor<PreferenceNotification> captor =
                ArgumentCaptor.forClass(PreferenceNotification.class);
        verify(preferenceRepository).save(captor.capture());

        assertFalse(captor.getValue().isInAppActif());
        assertSame(employeur, captor.getValue().getUtilisateur());
    }

    @Test
    @DisplayName("Refuse les préférences d'un utilisateur inconnu")
    void refuseLesPreferencesDUnUtilisateurInconnu() {
        when(utilisateurRepository.findByEmail("x@y.com")).thenReturn(null);

        assertThrows(NotFoundException.class, () -> service.preferences("x@y.com"));
        assertThrows(NotFoundException.class, () -> service.modifierPreferences("x@y.com", true));
    }
}
