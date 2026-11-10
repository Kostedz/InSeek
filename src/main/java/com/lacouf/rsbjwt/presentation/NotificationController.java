package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.NotificationService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import com.lacouf.rsbjwt.service.dto.PreferencesNotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> mesNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.lister(principal.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> nonLues(Principal principal) {
        return ResponseEntity.ok(Map.of("count", notificationService.compterNonLues(principal.getName())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> marquerLue(@PathVariable Long id, Principal principal)
            throws NotFoundException {
        return ResponseEntity.ok(notificationService.marquerLue(id, principal.getName()));
    }

    @GetMapping("/preferences")
    public ResponseEntity<PreferencesNotificationDTO> preferences(Principal principal)
            throws NotFoundException {
        return ResponseEntity.ok(notificationService.preferences(principal.getName()));
    }

    @PutMapping("/preferences")
    public ResponseEntity<PreferencesNotificationDTO> modifierPreferences(
            @RequestBody PreferencesNotificationDTO dto, Principal principal) throws NotFoundException {
        return ResponseEntity.ok(
                notificationService.modifierPreferences(principal.getName(), dto.inAppActif()));
    }
}