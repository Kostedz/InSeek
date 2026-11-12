package com.lacouf.rsbjwt.presentation.notification;

import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
public class SseController {
    private final SseService sseService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository utilisateurRepository;

    @GetMapping(path = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam(required = false) String token) {
        Long userId = null;
        if (token != null && !token.isBlank()) {
            try {
                String email = jwtTokenProvider.getEmailFromJWT(token);
                Utilisateur user = utilisateurRepository.findByEmail(email);
                if (user != null) userId = user.getId();
            } catch (Exception ignored) {
            }
        }
        return sseService.streamNotifications(userId);
    }
}