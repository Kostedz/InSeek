package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Etudiant;
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

import static org.junit.jupiter.api.Assertions.*;
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

    private void stubNotificationSave() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("streamNotifications() returns an emitter and registers the client")
    void streamNotifications_ReturnsEmitter_RegistersClient() {
        String recipientEmail = "student@example.com";

        SseEmitter emitter = sseService.streamNotifications(recipientEmail);

        assertNotNull(emitter);
        assertSame(clients.get(recipientEmail), emitter);
    }

    @Test
    @DisplayName("sendNotification() sends an event to a connected client")
    void sendNotification_SendsEvent_ToConnectedClient() throws IOException {
        stubNotificationSave();
        SseEmitter emitter = mock(SseEmitter.class);
        Utilisateur recipient = Etudiant.builder()
                .email("student@example.com")
                .build();

        String recipientEmail = recipient.getCredentials().getEmail();
        clients.put(recipientEmail, emitter);

        sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);

        verify(notificationRepository).save(any(Notification.class));
        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("sendNotification() removes a client when sending fails")
    void sendNotification_RemovesClient_OnError() throws IOException {
        stubNotificationSave();
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IllegalStateException("client disconnected"))
                .when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        Utilisateur recipient = Etudiant.builder()
                .email("student@example.com")
                .build();

        String recipientEmail = recipient.getCredentials().getEmail();
        clients.put(recipientEmail, emitter);

        sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);

        assertTrue(clients.isEmpty());
        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter).complete();
        verify(notificationRepository).save(argThat(notification ->
                notification.getMessage().equals(NotificationType.CV_TO_APPROVE.getMessage())
                        && notification.getRecipient().equals(recipient)));
    }

    @Test
    @DisplayName("sendNotification() saves a notification when the client is absent")
    void sendNotification_SavesNotification_WhenClientIsAbsent() {
        stubNotificationSave();
        Utilisateur recipient = Etudiant.builder()
                .email("offline@example.com")
                .build();

        sseService.sendNotification(NotificationType.CV_APPROVED, recipient);

        verify(notificationRepository).save(argThat(notification ->
                notification.getMessage().equals(NotificationType.CV_APPROVED.getMessage())
                        && notification.getRecipient().equals(recipient)));
    }
}
