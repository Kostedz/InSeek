package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.EntrevueService;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;


@ExtendWith(MockitoExtension.class)
public class EntrevueControllerTest {

    @Mock
    private EntrevueService interviewService;
    @Mock
    private AuthService authService;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private EntrevueController controller;

    private static final Long EMPLOYER_ID = 1L;

    // P: wtf, utilise @BeforeEach pour ça
    private CreateEntrevueDTO requestBody() {
        return new CreateEntrevueDTO(2L, 3L, LocalDateTime.now().plusDays(1),
                ModeEntrevue.IN_PERSON, "Salle 101", "Bienvenue");
    }

    @Test
    void scheduleInterview_validRequest_returns200WithBody() throws Exception {
        CreateEntrevueDTO dto = requestBody();
        EntrevueDTO saved = EntrevueDTO.builder()
                .id(10L).employerId(EMPLOYER_ID).studentId(2L).offerId(3L)
                .DateAndTime(dto.DateAndTime()).mode(dto.mode())
                .locationOrLink(dto.locationOrLink()).message(dto.message())
                .build();
        when(authService.validateJwt(request)).thenReturn(true);
        when(interviewService.scheduleInterview(EMPLOYER_ID, dto)).thenReturn(saved);

        ResponseEntity<?> response = controller.scheduleInterview(EMPLOYER_ID, dto, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(saved, response.getBody());
    }

    @Test
    void scheduleInterview_invalidToken_returns401AndDoesNotCallService() throws Exception {
        when(authService.validateJwt(request)).thenReturn(false);

        ResponseEntity<?> response = controller.scheduleInterview(EMPLOYER_ID, requestBody(), request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("token invalide", response.getBody());
        verifyNoInteractions(interviewService);
    }

    @Test
    void scheduleInterview_badRequest_returns400WithMessage() throws Exception {
        CreateEntrevueDTO dto = requestBody();
        when(authService.validateJwt(request)).thenReturn(true);
        when(interviewService.scheduleInterview(EMPLOYER_ID, dto))
                .thenThrow(new BadRequestException("champs invalides"));

        ResponseEntity<?> response = controller.scheduleInterview(EMPLOYER_ID, dto, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("champs invalides", response.getBody());
    }

    @Test
    void scheduleInterview_notFound_returns404WithMessage() throws Exception {
        CreateEntrevueDTO dto = requestBody();
        when(authService.validateJwt(request)).thenReturn(true);
        when(interviewService.scheduleInterview(EMPLOYER_ID, dto))
                .thenThrow(new NotFoundException("Étudiant non trouvé"));

        ResponseEntity<?> response = controller.scheduleInterview(EMPLOYER_ID, dto, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Étudiant non trouvé", response.getBody());
    }

}
