package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.EntrevueService;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;


@ExtendWith(MockitoExtension.class)
public class EntrevueControllerTest {

    @Mock
    private EntrevueService interviewService;
    @Mock
    private Authentication authentication;
    @Mock
    private AuthService authService;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private EntrevueController controller;

    private static final String EMPLOYER_EMAIL = "employer@example.com";

    private CreateEntrevueDTO createEntrevueDTO;

    @BeforeEach
    void setUp() {
        createEntrevueDTO = new CreateEntrevueDTO(2L, 3L, LocalDateTime.now().plusDays(1),
                ModeEntrevue.IN_PERSON, "Salle 101", "Bienvenue");
        when(authentication.getName()).thenReturn(EMPLOYER_EMAIL);
    }


    @Test
    void scheduleInterview_validRequest_returns200WithBody() throws Exception {
        EntrevueDTO saved = EntrevueDTO.builder()
                .id(10L).employerId(1L).studentId(2L).offerId(3L)
                .DateAndTime(createEntrevueDTO.DateAndTime()).mode(createEntrevueDTO.mode())
                .locationOrLink(createEntrevueDTO.locationOrLink()).message(createEntrevueDTO.message())
                .build();
        when(interviewService.scheduleInterview(EMPLOYER_EMAIL, createEntrevueDTO)).thenReturn(saved);

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(saved, response.getBody());
    }

    @Test
    void scheduleInterview_badRequest_returns400WithMessage() throws Exception {
        when(interviewService.scheduleInterview(EMPLOYER_EMAIL, createEntrevueDTO))
                .thenThrow(new BadRequestException("champs invalides"));

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("champs invalides", response.getBody());
    }

    @Test
    void scheduleInterview_notFound_returns404WithMessage() throws Exception {
        when(interviewService.scheduleInterview(EMPLOYER_EMAIL, createEntrevueDTO))
                .thenThrow(new NotFoundException("Étudiant non trouvé"));

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Étudiant non trouvé", response.getBody());
    }

}
