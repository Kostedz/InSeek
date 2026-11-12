package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.NotificationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;


import java.util.List;

import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SseController.class)
class SseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SseService sseService;

    @MockitoBean
    private UtilisateurService utilisateurService;

    @MockitoBean
    private DocumentService documentService;

    @MockitoBean
    private UtilisateurRepository utilisateurRepository;

    @Test
    @DisplayName("Connects to event stream")
    void connectsToEventStream() throws Exception {
        Utilisateur recipient = Gestionnaire.builder()
                .email("email@mail.ca")
                .build();

        when(sseService.streamNotifications(recipient.getEmail()))
                .thenReturn(new SseEmitter());

        mockMvc.perform(get("/notifications")
                        .param("recipient", recipient.getEmail())
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        then(sseService).should().streamNotifications(recipient.getEmail());
    }

    @Test
    @DisplayName("Recovers notifications")
    void recoverNotifications() throws Exception {
        when(sseService.recoverNotifications(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(new NotificationDTO(1L, "Test notification")));

        mockMvc.perform(get("/notifications/recover"))
                .andExpect(status().isOk());

        then(sseService).should().recoverNotifications(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("Clears notifications")
    void clearNotifications() throws Exception {
        mockMvc.perform(post("/notifications/clear")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1]"))
                .andExpect(status().isOk());

        then(sseService).should().clearNotifications(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq(List.of(1L)));
    }
}
