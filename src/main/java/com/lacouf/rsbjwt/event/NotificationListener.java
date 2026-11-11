package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationRepository notificationRepository;
    private final SseService sseService;

    @EventListener
    @Transactional
    public void handle(NotificationEvent event) {
        if (event.destinataire() == null) return;

        Notification notification = notificationRepository
                .findFirstByDestinataireIdAndLienDirectAndLueFalseOrderByCreatedAtDesc(
                        event.destinataire().getId(), event.lienDirect())
                .orElseGet(() -> Notification.builder()
                        .destinataire(event.destinataire())
                        .lienDirect(event.lienDirect())
                        .lue(false)
                        .nombre(1)
                        .build());

        if (notification.getId() != null && event.cumulatif()) {
            int actuel = notification.getNombre() == null ? 1 : notification.getNombre();
            notification.setNombre(actuel + 1);
        }

        notification.setTitre(event.titre());
        notification.setMe(event.message().apply(notification.getNombre()));
        notification.setLue(false);

        Notification saved = notificationRepository.save(notification);
        sseService.notifyUser(event.destinataire().getId(), NotificationDTO.of(saved));
    }
}