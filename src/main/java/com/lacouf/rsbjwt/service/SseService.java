package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.util.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseService {
    private final Set<SseEmitter> clients = ConcurrentHashMap.newKeySet();

    public SseEmitter streamNotifications() {
        SseEmitter emitter = new SseEmitter(0L);
        clients.add(emitter);

        Runnable remove = () -> clients.remove(emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> {
            remove.run();
            emitter.complete();
        });
        emitter.onError(error -> remove.run());

        return emitter;
    }

    public void sendNotification(NotificationType type) {
        for (SseEmitter client : clients) {
            try {
                client.send(SseEmitter.event().name("notification").data(type.getMessage()));
            } catch (Exception e) {
                clients.remove(client);
            }
        }
    }
}
