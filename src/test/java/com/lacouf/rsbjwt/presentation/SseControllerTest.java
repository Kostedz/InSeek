package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;


import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SseController.class)
class SseControllerTest {
    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    SseService sseService;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    UtilisateurRepository utilisateurRepository;


    @Test
    @DisplayName("Connects to event stream")
    void connects_to_event_stream() throws Exception {
        Utilisateur recipient = Gestionnaire.builder()
                .email("email@mail.ca")
                .build();
        when(sseService.streamNotifications(recipient.getEmail())).thenReturn(new SseEmitter());

        mockMvc.perform(get("/notifications").param("recipient", recipient.getEmail()))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        then(sseService).should().streamNotifications(recipient.getEmail());
    }

    @Test
    @DisplayName("Recover notifications")
    void recover_notifications() throws Exception {
        mockMvc.perform(get("/notifications/recover"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Clear notification")
    void clear_notification() throws Exception {
        mockMvc.perform(post("/notifications/clear/1"))
                .andExpect(status().isOk());
    }
}
