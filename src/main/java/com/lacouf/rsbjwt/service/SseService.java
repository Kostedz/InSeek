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
    private static final long ANONYMOUS = -1L;

    private final Map<SseEmitter, Long> clients = new ConcurrentHashMap<>();

    public SseEmitter streamNotifications() {
        return streamNotifications(null);
    }

    public SseEmitter streamNotifications(Long userId) {
        SseEmitter emitter = new SseEmitter(0L);
        clients.put(emitter, userId != null ? userId : ANONYMOUS);

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

    public void notifyUser(Long userId, Object payload) {
        if (userId == null) return;
        clients.forEach((emitter, id) -> {
            if (userId.equals(id)) send(emitter, payload);
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