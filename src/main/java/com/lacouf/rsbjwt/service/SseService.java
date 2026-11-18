package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.util.NotificationType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SseService {
    private static final String ANONYMOUS = "";

    private final Map<SseEmitter, String> clients = new ConcurrentHashMap<>();

    public SseEmitter streamNotifications() {
        return streamNotifications(null);
    }

    public SseEmitter streamNotifications(String userEmail) {
        SseEmitter emitter = new SseEmitter(0L);
        clients.put(emitter, userEmail != null ? userEmail : ANONYMOUS);

        Runnable remove = () -> clients.remove(emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> {
            remove.run();
            emitter.complete();
        });
        emitter.onError(error -> remove.run());

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (Exception e) {
            clients.remove(emitter);
        }

        return emitter;
    }

    public void sendNotification(NotificationType type) {
        clients.keySet().forEach(emitter -> send(emitter, type.getMessage()));
    }

    public void notifyUser(String userEmail, Object payload) {
        if (userEmail == null) return;
        clients.forEach((emitter, email) -> {
            if (userEmail.equals(email)) send(emitter, payload);
        });
    }

    private void send(SseEmitter emitter, Object payload) {
        try {
            SseEmitter.SseEventBuilder event = SseEmitter.event().name("notification");
            if (payload instanceof String text) {
                event.data(text);
            } else {
                event.data(payload, MediaType.APPLICATION_JSON);
            }
            emitter.send(event);
        } catch (Exception e) {
            log.warn("Échec d'envoi SSE, client retiré", e);
            clients.remove(emitter);
        }
    }
}
