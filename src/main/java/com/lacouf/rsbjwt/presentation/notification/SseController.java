package com.lacouf.rsbjwt.presentation.notification;

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

    @GetMapping(path = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam(required = false) String token) {
        String email = null;
        if (token != null && !token.isBlank()) {
            try {
                email = jwtTokenProvider.getEmailFromJWT(token);
            } catch (Exception ignored) {
            }
        }
        return email == null
                ? sseService.streamNotifications()
                : sseService.streamNotifications(email);
    }
}
