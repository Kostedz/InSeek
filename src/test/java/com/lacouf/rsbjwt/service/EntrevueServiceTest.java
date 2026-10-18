package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EntrevueServiceTest {

    @Mock
    private EntrevueRepository interviewRepository;
    @Mock
    private UtilisateurRepository userRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private EntrevueService entrevueService;

    private static final String EMPLOYER_EMAIL = "employer@example.com";
    private static final String TOKEN = "test-token";
    private static final String AUTHORIZATION_HEADER = "Bearer " + TOKEN;

    private static final Long EMPLOYER_ID = 1L;
    private static final Long STUDENT_ID = 2L;
    private static final Long OFFER_ID = 3L;

    private CreateEntrevueDTO validDto;

    @BeforeEach
    void setUp() {
        validDto = new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, LocalDateTime.now().plusDays(1),
                ModeEntrevue.VIDEO_CALL, "https://meet.example.com/abc", "Bienvenue");
        lenient().when(request.getHeader("Authorization"))
                .thenReturn(AUTHORIZATION_HEADER);

        lenient().when(jwtTokenProvider.getEmailFromJWT(TOKEN))
                .thenReturn(EMPLOYER_EMAIL);
    }


    @Test
    void scheduleInterview_validData_savesInterviewAndUpdatesStudent() throws Exception {
        Employeur employer = mock(Employeur.class);
        Etudiant student = mock(Etudiant.class);
        OffreDeStage offer = mock(OffreDeStage.class);
        when(employer.getId()).thenReturn(EMPLOYER_ID);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(offer.getId()).thenReturn(OFFER_ID);

        when(userRepository.findByEmail(EMPLOYER_EMAIL)).thenReturn(employer);
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(documentRepository.findInternshipOfferById(OFFER_ID)).thenReturn(Optional.of(offer));
        when(interviewRepository.save(any(Entrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        EntrevueDTO result = entrevueService.scheduleInterview(request, validDto);

        ArgumentCaptor<Entrevue> captor = ArgumentCaptor.forClass(Entrevue.class);
        verify(interviewRepository).save(captor.capture());
        Entrevue saved = captor.getValue();
        assertSame(employer, saved.getEmployer());
        assertSame(student, saved.getStudent());
        assertSame(offer, saved.getInternshipOffer());
        assertEquals(validDto.DateAndTime(), saved.getDateInterview());
        assertEquals(validDto.mode(), saved.getModeInterview());
        assertEquals(validDto.locationOrLink(), saved.getLocationOrLink());
        assertEquals(validDto.message(), saved.getMessage());

        verify(student).setDateInterview(validDto.DateAndTime());
        verify(student).setStatutRecherche(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);

        assertEquals(EMPLOYER_ID, result.employerId());
        assertEquals(STUDENT_ID, result.studentId());
        assertEquals(OFFER_ID, result.offerId());
        assertEquals(validDto.DateAndTime(), result.DateAndTime());
        assertEquals(validDto.mode(), result.mode());
        assertEquals(validDto.locationOrLink(), result.locationOrLink());
        assertEquals(validDto.message(), result.message());
    }

    static Stream<CreateEntrevueDTO> invalidDtos() {
        LocalDateTime future = LocalDateTime.now().plusDays(1);
        return Stream.of(
                new CreateEntrevueDTO(null, OFFER_ID, future, ModeEntrevue.IN_PERSON, "Salle 101", "Veuillez nous rejoindre ici"),
                new CreateEntrevueDTO(STUDENT_ID, null, future, ModeEntrevue.IN_PERSON, "Salle 101", "Veuillez nous rejoindre ici"),
                new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, null, ModeEntrevue.IN_PERSON, "Salle 101", "Veuillez nous rejoindre ici"),
                new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, future, null, "Salle 101", "Veuillez nous rejoindre ici"),
                new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, future, ModeEntrevue.IN_PERSON, null, "Veuillez nous rejoindre ici"),
                new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, future, ModeEntrevue.IN_PERSON, "Salle 101", null)
        );
    }


    @ParameterizedTest
    @MethodSource("invalidDtos")
    void scheduleInterview_missingField_throwsBadRequest(CreateEntrevueDTO invalid) {
        assertThrows(BadRequestException.class,
                () -> entrevueService.scheduleInterview(request, invalid));

        verifyNoInteractions(interviewRepository, userRepository, documentRepository, jwtTokenProvider);
    }

    @Test
    void scheduleInterview_dateInThePast_throwsBadRequest() {
        CreateEntrevueDTO past = new CreateEntrevueDTO(STUDENT_ID, OFFER_ID, LocalDateTime.now().minusHours(1),
                ModeEntrevue.VIDEO_CALL, "https://meet.example.com/abc", "cliquez ici pour rejoindre");

        assertThrows(BadRequestException.class,
                () -> entrevueService.scheduleInterview(request, past));

        verifyNoInteractions(interviewRepository, userRepository, documentRepository);
    }

    @Test
    void scheduleInterview_employerEmailUnknown_throwsNotFound() {
        when(userRepository.findByEmail(EMPLOYER_EMAIL)).thenReturn(null);

        assertThrows(NotFoundException.class,
                () -> entrevueService.scheduleInterview(request, validDto));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void scheduleInterview_userIsNotAnEmployer_throwsNotFound() {
        when(userRepository.findByEmail(EMPLOYER_EMAIL)).thenReturn(mock(Etudiant.class));

        assertThrows(NotFoundException.class,
                () -> entrevueService.scheduleInterview(request, validDto));

        verify(interviewRepository, never()).save(any());
    }


    @Test
    void scheduleInterview_studentNotFound_throwsNotFound() {
        when(userRepository.findByEmail(EMPLOYER_EMAIL)).thenReturn(mock(Employeur.class));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> entrevueService.scheduleInterview(request, validDto));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void scheduleInterview_offerNotFound_throwsNotFound() {
        when(userRepository.findByEmail(EMPLOYER_EMAIL)).thenReturn(mock(Employeur.class));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(mock(Etudiant.class)));
        when(documentRepository.findInternshipOfferById(OFFER_ID)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> entrevueService.scheduleInterview(request, validDto));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void checkPastInterviews_studentInvited_changesStatusToWaitingForResponse() {
        Etudiant student = mock(Etudiant.class);
        when(student.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);
        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(Entrevue.builder().student(student).build()));

        entrevueService.checkPastInterviews();

        verify(student).setStatutRecherche(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
        verify(userRepository).save(student);
    }

    @Test
    void checkPastInterviews_mixedStatuses_onlyUpdatesInvitedStudents() {
        Etudiant invited = mock(Etudiant.class);
        Etudiant alreadyWaiting = mock(Etudiant.class);
        when(invited.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);
        when(alreadyWaiting.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(
                        Entrevue.builder().student(invited).build(),
                        Entrevue.builder().student(alreadyWaiting).build()));

        entrevueService.checkPastInterviews();

        verify(invited).setStatutRecherche(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
        verify(userRepository).save(invited);
        verify(alreadyWaiting, never()).setStatutRecherche(any());
        verify(userRepository, never()).save(alreadyWaiting);
    }

    @Test
    void checkPastInterviews_noPastInterviews_doesNothing() {
        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of());

        entrevueService.checkPastInterviews();

        verifyNoInteractions(userRepository);
    }


}
