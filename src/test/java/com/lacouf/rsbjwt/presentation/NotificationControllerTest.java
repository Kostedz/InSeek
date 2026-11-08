package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.TypeNotification;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtAuthenticationEntryPoint;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.NotificationService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    NotificationService notificationService;

    @MockitoBean
    JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockitoBean
    UtilisateurRepository utilisateurRepository;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    UtilisateurService utilisateurService;

    private final Principal employeur = () -> "ubisoft@mail.com";

    private NotificationDTO dto(boolean lue) {
        return new NotificationDTO(5L, TypeNotification.EVALUATION_STAGIAIRE,
                "Veuillez remplir l'évaluation", 10L, lue, LocalDateTime.now());
    }

    @Test
    @DisplayName("GET /notifications retourne 200 et les notifications de l'utilisateur")
    void mesNotifications_retourne200() throws Exception {
        when(notificationService.lister("ubisoft@mail.com")).thenReturn(List.of(dto(false)));

        mockMvc.perform(get("/notifications").principal(employeur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].type").value("EVALUATION_STAGIAIRE"))
                .andExpect(jsonPath("$[0].lue").value(false));
    }

    @Test
    @DisplayName("GET /notifications/unread-count retourne 200 et le nombre de non lues")
    void nonLues_retourne200() throws Exception {
        when(notificationService.compterNonLues("ubisoft@mail.com")).thenReturn(3L);

        mockMvc.perform(get("/notifications/unread-count").principal(employeur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));
    }

    @Test
    @DisplayName("PATCH /notifications/{id}/read retourne 200 et la notification lue")
    void marquerLue_retourne200() throws Exception {
        when(notificationService.marquerLue(5L, "ubisoft@mail.com")).thenReturn(dto(true));

        mockMvc.perform(patch("/notifications/5/read").principal(employeur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lue").value(true));
    }

    @Test
    @DisplayName("PATCH /notifications/{id}/read avec une notification introuvable retourne 404")
    void marquerLue_introuvable_retourne404() throws Exception {
        when(notificationService.marquerLue(9L, "ubisoft@mail.com"))
                .thenThrow(new NotFoundException("Notification introuvable"));

        mockMvc.perform(patch("/notifications/9/read").principal(employeur))
                .andExpect(status().isNotFound());
    }
}