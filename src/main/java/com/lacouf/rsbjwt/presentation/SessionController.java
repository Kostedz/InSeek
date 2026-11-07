package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.ApplicationStageService;
import com.lacouf.rsbjwt.service.SessionService;
import com.lacouf.rsbjwt.service.dto.SessionDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/gestionnaire/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final ApplicationStageService offreDeStageService;

    @GetMapping
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<List<SessionDTO>> getSessions() {
        return ResponseEntity.ok(sessionService.listerToutesLesSessions());
    }

    @GetMapping("/{sessionId}/offres")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<List<OffreDeStageDTO>> getOffersBySession(@PathVariable String sessionId) {
        return ResponseEntity.ok(offreDeStageService.listerOffresParSession(sessionId));
    }
}