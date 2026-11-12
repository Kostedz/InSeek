package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.presentation.notification.SseController;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;


import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
        when(sseService.streamNotifications()).thenReturn(new SseEmitter());

        mockMvc.perform(get("/notifications"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        then(sseService).should().streamNotifications();
    }
}
