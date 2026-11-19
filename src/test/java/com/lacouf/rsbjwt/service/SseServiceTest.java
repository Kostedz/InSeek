package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;
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
        assertTrue(clients.containsKey(emitter));
        assertEquals(recipientEmail, clients.get(emitter));
    }





}
