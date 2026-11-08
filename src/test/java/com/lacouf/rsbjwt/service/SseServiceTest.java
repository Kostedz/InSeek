package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.util.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SseServiceTest {

    @Mock
    private UtilisateurService utilisateurService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthService authService;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private SseService sseService;
    private Map<String, SseEmitter> clients;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        clients = (Map<String, SseEmitter>) ReflectionTestUtils.getField(sseService, "clients");
    }


    @Test
    @DisplayName("streamNotifications() retourne un SseEmitter et enregistre le client - 200")
    public void streamNotifications_ReturnsEmitter_RegistersClient() {
        String recipient = "student@example.com";
        SseEmitter emitter = sseService.streamNotifications(recipient);

        assertNotNull(emitter);
        assertTrue(clients.get(recipient) == emitter);
    }

    @Test
    @DisplayName("sendNotification() envoie un événement aux clients connectés - 200")
    public void sendNotification_SendsEvent_ToConnected_Clients() throws IOException {
        SseEmitter emitter = mock(SseEmitter.class);
        Utilisateur recipient = Etudiant
                .builder()
                .email("student@example.com")
                .build();


        clients.put(recipient.getEmail(), emitter);

        // n'importe quelle notification pour tester l'envoi
        sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("sendNotification() supprime un client en cas d'erreur - 200")
    public void sendNotification_RemovesCleint_OnError() throws IOException {
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IllegalStateException("client disconnected")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        Utilisateur recipient = Etudiant
                .builder()
                .email("student@example.com")
                .build();

        clients.put(recipient.getEmail(), emitter);

        // n'importe quelle notification pour tester l'envoi
        sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);
        assertTrue(clients.isEmpty());
        verify(notificationRepository).save(argThat(notification ->
                notification.getMessage().equals(NotificationType.CV_TO_APPROVE.getMessage())
                        && notification.getRecipient().equals(recipient)));
    }

    @Test
    @DisplayName("sendNotification() sauvegarde une notification si le client est absent")
    void sendNotification_SavesNotification_WhenClientIsAbsent() {
        String recipient = "offline@example.com";
        Utilisateur recipientUser = Etudiant
                .builder()
                .email(recipient)
                .build();
        sseService.sendNotification(NotificationType.CV_APPROVED, recipientUser);

        verify(notificationRepository).save(argThat(notification ->
                notification.getMessage().equals(NotificationType.CV_APPROVED.getMessage())
                        && notification.getRecipient().equals(recipientUser)));
    }
}
