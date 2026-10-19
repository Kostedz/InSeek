package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
import com.lacouf.rsbjwt.service.EntrevueService;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import com.lacouf.rsbjwt.service.dto.RepondreConvocationDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;


@ExtendWith(MockitoExtension.class)
public class EntrevueControllerTest {

    @Mock
    private EntrevueService interviewService;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private EntrevueController controller;

    private static final String EMPLOYER_EMAIL = "employer@example.com";

    private CreateEntrevueDTO createEntrevueDTO;
    private EntrevueDTO sampleEntrevueDTO;

    @BeforeEach
    void setUp() {
        createEntrevueDTO = new CreateEntrevueDTO(2L, 3L, LocalDateTime.now().plusDays(1),
                ModeEntrevue.IN_PERSON, "Salle 101", "Bienvenue");

        sampleEntrevueDTO = EntrevueDTO.builder()
                .id(10L).employerId(1L).studentId(2L).offerId(3L)
                .DateAndTime(createEntrevueDTO.DateAndTime()).mode(createEntrevueDTO.mode())
                .locationOrLink(createEntrevueDTO.locationOrLink()).message(createEntrevueDTO.message())
                .build();

    }


    @Test
    void scheduleInterview_validRequest_returns200WithBody() throws Exception {
        EntrevueDTO saved = EntrevueDTO.builder()
                .id(10L).employerId(1L).studentId(2L).offerId(3L)
                .DateAndTime(createEntrevueDTO.DateAndTime()).mode(createEntrevueDTO.mode())
                .locationOrLink(createEntrevueDTO.locationOrLink()).message(createEntrevueDTO.message())
                .build();
        when(interviewService.scheduleInterview(request, createEntrevueDTO)).thenReturn(saved);

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(saved, response.getBody());
    }

    @Test
    void scheduleInterview_badRequest_returns400WithMessage() throws Exception {
        when(interviewService.scheduleInterview(request, createEntrevueDTO))
                .thenThrow(new BadRequestException("champs invalides"));

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("champs invalides", response.getBody());
    }

    @Test
    void scheduleInterview_notFound_returns404WithMessage() throws Exception {
        when(interviewService.scheduleInterview(request, createEntrevueDTO))
                .thenThrow(new NotFoundException("Étudiant non trouvé"));

        ResponseEntity<?> response = controller.scheduleInterview(createEntrevueDTO, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Étudiant non trouvé", response.getBody());
    }

    @Test
    void getMyInterviews_validStudent_returns200WithList() throws Exception {
        when(interviewService.getInterviewsForStudent(request)).thenReturn(List.of(sampleEntrevueDTO));
        ResponseEntity<?> response = controller.getMyInterviews(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(sampleEntrevueDTO), response.getBody());
    }
    @Test
    void getMyInterviews_studentNotFound_returns404() throws Exception {
        when(interviewService.getInterviewsForStudent(request))
                .thenThrow(new NotFoundException("Étudiant non trouvé"));
        ResponseEntity<?> response = controller.getMyInterviews(request);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Étudiant non trouvé", response.getBody());
    }

    @Test
    void getInterviewDetails_validId_returns200WithBody() throws Exception {
        when(interviewService.getInterviewDetails(10L, request)).thenReturn(sampleEntrevueDTO);
        ResponseEntity<?> response = controller.getInterviewDetails(10L, request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(sampleEntrevueDTO, response.getBody());
    }
    @Test
    void getInterviewDetails_notFound_returns404() throws Exception {
        when(interviewService.getInterviewDetails(10L, request))
                .thenThrow(new NotFoundException("Convocation non trouvée."));
        ResponseEntity<?> response = controller.getInterviewDetails(10L, request);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Convocation non trouvée.", response.getBody());
    }
    @Test
    void getInterviewDetails_badRequest_returns400() throws Exception {
        when(interviewService.getInterviewDetails(10L, request))
                .thenThrow(new BadRequestException("Accès refusé à cette convocation."));
        ResponseEntity<?> response = controller.getInterviewDetails(10L, request);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Accès refusé à cette convocation.", response.getBody());
    }

    @Test
    void respondToInterview_validAccept_returns200() throws Exception {
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        when(interviewService.respondToInterviewInvitation(10L, acceptDto, request)).thenReturn(sampleEntrevueDTO);
        ResponseEntity<?> response = controller.respondToInterview(10L, acceptDto, request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(sampleEntrevueDTO, response.getBody());
    }
    @Test
    void respondToInterview_notFound_returns404() throws Exception {
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        when(interviewService.respondToInterviewInvitation(10L, acceptDto, request))
                .thenThrow(new NotFoundException("Convocation non trouvée."));
        ResponseEntity<?> response = controller.respondToInterview(10L, acceptDto, request);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Convocation non trouvée.", response.getBody());
    }
    @Test
    void respondToInterview_badRequest_returns400() throws Exception {
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        when(interviewService.respondToInterviewInvitation(10L, acceptDto, request))
                .thenThrow(new BadRequestException("La date de cette convocation est déjà passée."));
        ResponseEntity<?> response = controller.respondToInterview(10L, acceptDto, request);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("La date de cette convocation est déjà passée.", response.getBody());
    }
    @Test
    void respondToInterview_conflict_returns409() throws Exception {
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        when(interviewService.respondToInterviewInvitation(10L, acceptDto, request))
                .thenThrow(new ConflictException("Vous avez déjà répondu à cette convocation."));
        ResponseEntity<?> response = controller.respondToInterview(10L, acceptDto, request);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Vous avez déjà répondu à cette convocation.", response.getBody());
    }

}
