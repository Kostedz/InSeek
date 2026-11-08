package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/gestionnaire/dev")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.dev.enabled", havingValue = "true")
public class DevAlerteController {

    private final NotificationService notificationService;

    @PostMapping("/alerter-evaluations")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<Map<String, Integer>> declencher() {
        return ResponseEntity.ok(Map.of("creees", notificationService.alerterEvaluationsStagiaires()));
    }
}