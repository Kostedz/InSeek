package com.lacouf.rsbjwt.presentation.notification;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UtilisateurService utilisateurService;

    @GetMapping("/mine")
    public List<NotificationDTO> mine(Authentication authentication)
            throws BadRequestException, NotFoundException {
        Utilisateur user = utilisateurService.findEntityByEmail(authentication.getName());
        return notificationRepository
                .findByDestinataireIdAndLueFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDTO::of)
                .toList();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication authentication)
            throws BadRequestException, NotFoundException {
        Utilisateur user = utilisateurService.findEntityByEmail(authentication.getName());
        notificationRepository.findById(id)
                .filter(n -> n.getDestinataire() != null
                        && n.getDestinataire().getId().equals(user.getId()))
                .ifPresent(n -> {
                    n.setLue(true);
                    notificationRepository.save(n);
                });
        return ResponseEntity.noContent().build();
    }
}