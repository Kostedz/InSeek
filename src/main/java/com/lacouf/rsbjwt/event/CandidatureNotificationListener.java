package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.Notification;
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
        Utilisateur employeur = app.getOffreDeStage().getUtilisateur();
        if (employeur == null) return;

        String nomEtudiant = app.getEtudiant().getNom() + " " + app.getEtudiant().getPrenom();
        String titrePoste = app.getOffreDeStage().getPosition();
        String messageTextuel = nomEtudiant + " a postulé pour le poste de " + titrePoste;

        Notification notification = Notification.builder()
                .destinataire(employeur)
                .titre("Nouvelle candidature !")
                .me(messageTextuel)
                .lienDirect("/employeur?offre=" + app.getOffreDeStage().getId())
                .lue(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        sseService.notifyUser(employeur.getId(), NotificationDTO.of(saved));
    }
}