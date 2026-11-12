package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.util.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SseServiceTest {

    private SseService sseService;
    private Set<SseEmitter> clients;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        sseService = new SseService();
        clients = (Set<SseEmitter>) ReflectionTestUtils.getField(sseService, "clients");
    }


    @Test
    @DisplayName("streamNotifications() retourne un SseEmitter et enregistre le client - 200")
    public void streamNotifications_ReturnsEmitter_RegistersClient() {
        SseEmitter emitter = sseService.streamNotifications();

        assertNotNull(emitter);
        assertTrue(clients.contains(emitter));
    }

    @Test
    @DisplayName("sendNotification() envoie un événement aux clients connectés - 200")
    public void sendNotification_SendsEvent_ToConnected_Clients() throws IOException {
        SseEmitter emitter = mock(SseEmitter.class);
        clients.add(emitter);

        // n'importe quelle notification pour tester l'envoi
        sseService.sendNotification(NotificationType.CV_TO_APPROVE);

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("sendNotification() supprime un client en cas d'erreur - 200")
    public void sendNotification_RemovesCleint_OnError() throws IOException {
        SseEmitter emitter = mock(SseEmitter.class);
        doThrow(new IllegalStateException("client disconnected")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));
        clients.add(emitter);

        // n'importe quelle notification pour tester l'envoi
        sseService.sendNotification(NotificationType.CV_TO_APPROVE);
        assertTrue(clients.isEmpty());
    }
}
