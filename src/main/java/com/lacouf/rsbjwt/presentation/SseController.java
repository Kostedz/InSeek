package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;


@RestController
@RequiredArgsConstructor
public class SseController {
    private final SseService sseService;

    @GetMapping(path = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam String recipient) {
        return sseService.streamNotifications(recipient);
    }

    @GetMapping("/notifications/recover")
    public ResponseEntity<List<NotificationDTO>> recoverNotifications(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(sseService.recoverNotifications(request));
        } catch (NotFoundException | BadRequestException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/notifications/clear")
    public ResponseEntity<Void> clearNotifications(@RequestBody List<Long> notificationIds,
                                                    HttpServletRequest request) {
        try {
            sseService.clearNotifications(request, notificationIds);
            return ResponseEntity.ok().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}