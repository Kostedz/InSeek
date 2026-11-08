package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import com.lacouf.rsbjwt.service.util.NotificationType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SseService {
    private final Map<String, SseEmitter> clients = new ConcurrentHashMap<>();
    private final NotificationRepository notificationRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurService utilisateurService;
    private final AuthService authService;

    public SseEmitter streamNotifications(String recipientEmail) {
        SseEmitter emitter = new SseEmitter(0L);
        SseEmitter previousEmitter = clients.put(recipientEmail, emitter);
        if (previousEmitter != null) {
            previousEmitter.complete();
        }

        Runnable remove = () -> clients.remove(recipientEmail, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> {
            remove.run();
            emitter.complete();
        });
        emitter.onError(error -> remove.run());

        return emitter;
    }

    public void sendNotification(NotificationType type, Utilisateur recipient) {

        String recipientEmail = recipient.getCredentials().getEmail();
        Notification notification = saveNotification(type, recipient);

        SseEmitter client = clients.get(recipientEmail);
        if (client == null) {
            return;
        }
        try {
            client.send(SseEmitter.event().name("notification")
                    .data(new NotificationDTO(notification.getId(), notification.getMessage())));
        } catch (Exception e) {
            removeDisconnectedClient(recipientEmail, client);
        }
    }

    @Transactional
    public List<NotificationDTO> recoverNotifications(HttpServletRequest request) throws BadRequestException, NotFoundException {
        if (!authService.validateJwt(request)) {
            throw new BadRequestException("Invalid or missing token");
        }

        String email = jwtTokenProvider.getEmailFromJWT(request.getHeader("Authorization").substring(7));
        if (!utilisateurService.existsByEmail(email)) {
            throw new NotFoundException("User not found");
        }

        return notificationRepository.findByRecipientEmail(email).stream()
                .map(notification -> new NotificationDTO(notification.getId(), notification.getMessage()))
                .toList();
    }

    @Transactional
    public void clearNotifications(HttpServletRequest request, List<Long> notificationIds)
            throws BadRequestException, NotFoundException {
        if (!authService.validateJwt(request)) {
            throw new BadRequestException("Invalid or missing token");
        }

        String email = jwtTokenProvider.getEmailFromJWT(request.getHeader("Authorization").substring(7));
        if (!utilisateurService.existsByEmail(email)) {
            throw new NotFoundException("User not found");
        }
        Utilisateur recipient = utilisateurService.findEntityByEmail(email);

        notificationIds.forEach(notificationId ->
                notificationRepository.deleteByIdAndRecipient(notificationId, recipient));
    }

    private void removeDisconnectedClient(String recipient, SseEmitter client) {
        if (clients.remove(recipient, client)) {
            client.complete();
        }
    }

    private Notification saveNotification(NotificationType type, Utilisateur recipient) {
        return notificationRepository.save(Notification.builder()
                .message(type.getMessage())
                .recipient(recipient)
                .build());
    }
}
