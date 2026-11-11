package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class CandidatureNotificationListener {

    private final NotificationRepository notificationRepository;
    private final SseService sseService;

    @EventListener
    @Transactional
    public void handleCandidatureSoumise(CandidatureSoumiseEvent event) {
        ApplicationStage app = event.getApplicationStage();
        OffreDeStage offre = app.getOffreDeStage();
        Utilisateur employeur = offre.getUtilisateur();
        if (employeur == null) return;

        String lien = "/employeur?offre=" + offre.getId();

        Notification notification = notificationRepository
                .findFirstByDestinataireIdAndLienDirectAndLueFalseOrderByCreatedAtDesc(employeur.getId(), lien)
                .orElse(null);

        if (notification == null) {
            notification = Notification.builder()
                    .destinataire(employeur)
                    .titre("Nouvelle candidature !")
                    .lienDirect(lien)
                    .lue(false)
                    .nombre(1)
                    .build();
        } else {
            int actuel = notification.getNombre() == null ? 1 : notification.getNombre();
            notification.setNombre(actuel + 1);
        }

        notification.setMe(buildMessage(notification.getNombre(), offre.getPosition()));

        Notification saved = notificationRepository.save(notification);
        sseService.notifyUser(employeur.getId(), NotificationDTO.of(saved));
    }

    private String buildMessage(int nombre, String titrePoste) {
        String candidats = nombre > 1 ? "nouveaux candidats" : "nouveau candidat";
        return nombre + " " + candidats + " pour le poste de " + titrePoste;
    }
}