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
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SseServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private SseService sseService;
    private Map<SseEmitter, String> clients;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        sseService = new SseService();
        clients = (Map<SseEmitter, String>) ReflectionTestUtils.getField(sseService, "clients");
    }

    /** Ajoute directement un emitter mocké dans la map des clients. */
    private SseEmitter clientMocke(String email) {
        SseEmitter emitter = mock(SseEmitter.class);
        clients.put(emitter, email);
        return emitter;
    }

    static class ClientAbortException extends IOException {
        ClientAbortException(String message) {
            super(message);
        }
    }

    @Test
    @DisplayName("streamNotifications(email) retourne un emitter et enregistre le client")
    void streamNotifications_avecEmail_enregistreClient() {
        SseEmitter emitter = sseService.streamNotifications("student@example.com");

        assertNotNull(emitter);
        assertTrue(clients.containsKey(emitter));
        assertEquals("student@example.com", clients.get(emitter));
    }

    @Test
    @DisplayName("streamNotifications() sans argument enregistre un client anonyme")
    void streamNotifications_sansArgument_clientAnonyme() {
        SseEmitter emitter = sseService.streamNotifications();

        assertEquals("", clients.get(emitter));
    }

    @Test
    @DisplayName("streamNotifications(null) enregistre un client anonyme")
    void streamNotifications_emailNull_clientAnonyme() {
        SseEmitter emitter = sseService.streamNotifications(null);

        assertEquals("", clients.get(emitter));
    }

    @Test
    @DisplayName("streamNotifications() enregistre chaque connexion séparément")
    void streamNotifications_plusieursConnexions() {
        sseService.streamNotifications("a@a.com");
        sseService.streamNotifications("a@a.com");

        assertEquals(2, clients.size());
    }

    private Map<String, Object> initialiserEtCapturerCallbacks(SseEmitter emitter) throws Exception {
        Class<?> handlerType = Class.forName(
                "org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter$Handler");
        Map<String, Object> callbacks = new HashMap<>();
        Object handler = Proxy.newProxyInstance(handlerType.getClassLoader(), new Class<?>[]{handlerType},
                (proxy, method, args) -> {
                    if (method.getName().startsWith("on")) {
                        callbacks.put(method.getName(), args[0]);
                    }
                    return null;
                });
        ReflectionTestUtils.invokeMethod(emitter, "initialize", handler);
        return callbacks;
    }

    @Test
    @DisplayName("onCompletion retire le client")
    void callback_completion_retireClient() throws Exception {
        SseEmitter emitter = sseService.streamNotifications("a@a.com");
        Map<String, Object> callbacks = initialiserEtCapturerCallbacks(emitter);

        ((Runnable) callbacks.get("onCompletion")).run();

        assertFalse(clients.containsKey(emitter));
    }

    @Test
    @DisplayName("onTimeout retire le client")
    void callback_timeout_retireClient() throws Exception {
        SseEmitter emitter = sseService.streamNotifications("a@a.com");
        Map<String, Object> callbacks = initialiserEtCapturerCallbacks(emitter);

        ((Runnable) callbacks.get("onTimeout")).run();

        assertFalse(clients.containsKey(emitter));
    }

    @Test
    @DisplayName("onError retire le client")
    @SuppressWarnings("unchecked")
    void callback_erreur_retireClient() throws Exception {
        SseEmitter emitter = sseService.streamNotifications("a@a.com");
        Map<String, Object> callbacks = initialiserEtCapturerCallbacks(emitter);

        ((Consumer<Throwable>) callbacks.get("onError")).accept(new RuntimeException("boom"));

        assertFalse(clients.containsKey(emitter));
    }

    @Test
    @DisplayName("notifyUser() avec un courriel null n'envoie rien")
    void notifyUser_emailNull_neFaitRien() throws Exception {
        SseEmitter emitter = clientMocke("a@a.com");

        sseService.notifyUser(null, "hello");

        verify(emitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("notifyUser() envoie seulement au client correspondant (payload texte)")
    void notifyUser_envoieSeulementAuDestinataire() throws Exception {
        SseEmitter cible = clientMocke("a@a.com");
        SseEmitter autre = clientMocke("b@b.com");

        sseService.notifyUser("a@a.com", "hello");

        verify(cible).send(any(SseEmitter.SseEventBuilder.class));
        verify(autre, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("notifyUser() avec un payload objet l'envoie en JSON")
    void notifyUser_payloadObjet_envoieEnJson() throws Exception {
        SseEmitter cible = clientMocke("a@a.com");

        sseService.notifyUser("a@a.com", Map.of("id", 1));

        verify(cible).send(any(SseEmitter.SseEventBuilder.class));
    }

    private void verifierClientRetireApresErreur(Exception erreur) throws Exception {
        SseEmitter emitter = clientMocke("a@a.com");
        doThrow(erreur).when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        sseService.notifyUser("a@a.com", "hello");

        assertFalse(clients.containsKey(emitter));
    }

    @Test
    @DisplayName("send() retire le client sur AsyncRequestNotUsableException")
    void send_asyncRequestNotUsable_retireClient() throws Exception {
        verifierClientRetireApresErreur(new IOException("wrapper", new AsyncRequestNotUsableException("fermé")));
    }

    @Test
    @DisplayName("send() retire le client sur 'Broken pipe'")
    void send_brokenPipe_retireClient() throws Exception {
        verifierClientRetireApresErreur(new IOException("Broken pipe"));
    }

    @Test
    @DisplayName("send() retire le client sur 'Connection reset'")
    void send_connectionReset_retireClient() throws Exception {
        verifierClientRetireApresErreur(new IOException("Connection reset by peer"));
    }

    @Test
    @DisplayName("send() retire le client sur une ClientAbortException")
    void send_clientAbortException_retireClient() throws Exception {
        verifierClientRetireApresErreur(new ClientAbortException("abandon"));
    }

    @Test
    @DisplayName("send() retire le client sur une autre erreur (message inconnu)")
    void send_autreErreur_retireClient() throws Exception {
        verifierClientRetireApresErreur(new IOException("erreur quelconque"));
    }

    @Test
    @DisplayName("send() retire le client sur une erreur sans message")
    void send_erreurSansMessage_retireClient() throws Exception {
        SseEmitter emitter = clientMocke("a@a.com");
        doThrow(new IllegalStateException()).when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        sseService.notifyUser("a@a.com", "hello");

        assertFalse(clients.containsKey(emitter));
    }




}
