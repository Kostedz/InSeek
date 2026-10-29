package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import com.lacouf.rsbjwt.service.dto.RepondreConvocationDTO;
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
    private static final String STUDENT_EMAIL = "student@example.com";
    private static final String TOKEN = "test-token";
    private static final String AUTHORIZATION_HEADER = "Bearer " + TOKEN;

    private static final Long EMPLOYER_ID = 1L;
    private static final Long STUDENT_ID = 2L;
    private static final Long OFFER_ID = 3L;
    private static final Long INTERVIEW_ID = 10L;

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
        when(documentRepository.findOffreStageById(OFFER_ID)).thenReturn(Optional.of(offer));
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
        assertThrows(NotFoundException.class,
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
        when(documentRepository.findOffreStageById(OFFER_ID)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> entrevueService.scheduleInterview(request, validDto));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void checkPastInterviews_studentInvitedAndInterviewAccepted_changesStatusToWaitingForResponse() {
        Etudiant student = mock(Etudiant.class);
        Entrevue interview = mock(Entrevue.class);

        when(interview.getStudent()).thenReturn(student);
        when(interview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.ACCEPTED);
        when(student.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);

        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(interview));

        entrevueService.checkPastInterviews();

        verify(student).setStatutRecherche(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
        verify(userRepository).save(student);
    }

    @Test
    void checkPastInterviews_interviewNotAccepted_doesNotUpdateStudent() {
        Etudiant student = mock(Etudiant.class);
        Entrevue pendingInterview = mock(Entrevue.class);
        Entrevue rejectedInterview = mock(Entrevue.class);
        when(pendingInterview.getStudent()).thenReturn(student);
        when(pendingInterview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.PENDING);
        when(rejectedInterview.getStudent()).thenReturn(student);
        when(rejectedInterview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.REJECTED);
        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(pendingInterview, rejectedInterview));
        entrevueService.checkPastInterviews();
        verify(student, never()).setStatutRecherche(any());
        verify(userRepository, never()).save(student);
    }

    @Test
    void checkPastInterviews_mixedStatuses_onlyUpdatesInvitedStudents() {
        Etudiant invited = mock(Etudiant.class);
        Etudiant alreadyWaiting = mock(Etudiant.class);

        Entrevue interview1 = mock(Entrevue.class);
        when(interview1.getStudent()).thenReturn(invited);

        when(interview1.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.ACCEPTED);
        when(invited.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);
        when(alreadyWaiting.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);

        Entrevue interview2 = mock(Entrevue.class);
        when(interview2.getStudent()).thenReturn(alreadyWaiting);

        when(interview2.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.ACCEPTED);
        when(alreadyWaiting.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);

        when(interviewRepository.findByDateInterviewBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(interview1, interview2));

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

    @Test
    void getInterviewsForStudent_validStudent_returnsList() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);
        when(interviewRepository.findByStudentId(STUDENT_ID)).thenReturn(List.of(interview));
        List<EntrevueDTO> result = entrevueService.getInterviewsForStudent(request);
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(INTERVIEW_ID, result.get(0).id());
    }
    @Test
    void getInterviewsForStudent_studentNotFound_throwsNotFound() {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> entrevueService.getInterviewsForStudent(request));
        verify(interviewRepository, never()).findByStudentId(any());
    }

    @Test
    void getInterviewDetails_validStudentAndOwner_returnsDTO() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));
        EntrevueDTO dto = entrevueService.getInterviewDetails(INTERVIEW_ID, request);
        assertNotNull(dto);
        assertEquals(INTERVIEW_ID, dto.id());
    }
    @Test
    void getInterviewDetails_notOwner_throwsBadRequest() {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);

        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);

        Etudiant otherStudent = mock(Etudiant.class);
        when(otherStudent.getId()).thenReturn(999L);

        Entrevue interview = mock(Entrevue.class);
        when(interview.getStudent()).thenReturn(otherStudent);

        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));

        assertThrows(BadRequestException.class,
                () -> entrevueService.getInterviewDetails(INTERVIEW_ID, request));
    }
    @Test
    void getInterviewDetails_interviewNotFound_throwsNotFound() {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class,
                () -> entrevueService.getInterviewDetails(INTERVIEW_ID, request));
    }

    @Test
    void respondToInterview_accept_updatesInterviewStatusAndKeepsStudentDate() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);

        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);
        when(interview.getDateInterview()).thenReturn(LocalDateTime.now().plusDays(2));
        when(interview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.PENDING);
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Entrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        EntrevueDTO result = entrevueService.respondToInterviewInvitation(INTERVIEW_ID, acceptDto, request);

        verify(interview).setInterviewInvitationStatus(StatutConvocationEntrevue.ACCEPTED);
        verify(interview).setInvitationResponseDate(any(LocalDateTime.class));
        verify(student, never()).setDateInterview(null);
        verify(student, never()).setStatutRecherche(StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP);
        verify(userRepository, never()).save(student);
        verify(interviewRepository).save(interview);
    }
    @Test
    void respondToInterview_reject_updatesInterviewAndCleansStudentProfile() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);
        when(interview.getDateInterview()).thenReturn(LocalDateTime.now().plusDays(2));
        when(interview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.PENDING);
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Entrevue.class))).thenAnswer(inv -> inv.getArgument(0));
        String comment = "Conflit d'horaire avec mes examens";
        RepondreConvocationDTO rejectDto = new RepondreConvocationDTO(StatutConvocationEntrevue.REJECTED, comment);
        EntrevueDTO result = entrevueService.respondToInterviewInvitation(INTERVIEW_ID, rejectDto, request);
        verify(interview).setInterviewInvitationStatus(StatutConvocationEntrevue.REJECTED);
        verify(interview).setInvitationResponseDate(any(LocalDateTime.class));
        verify(interview).setMessageWhenRejected(comment);

        verify(student).setDateInterview(null);
        verify(student).setStatutRecherche(StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP);
        verify(userRepository).save(student);
        verify(interviewRepository).save(interview);
    }
    @Test
    void respondToInterview_statusNullOrPending_throwsBadRequest() {
        RepondreConvocationDTO invalidDto = new RepondreConvocationDTO(StatutConvocationEntrevue.PENDING, null);
        assertThrows(BadRequestException.class,
                () -> entrevueService.respondToInterviewInvitation(INTERVIEW_ID, invalidDto, request));
        verifyNoInteractions(interviewRepository, userRepository);
    }
    @Test
    void respondToInterview_expiredInterview_throwsBadRequest() {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);

        when(interview.getDateInterview()).thenReturn(LocalDateTime.now().minusHours(2));
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        assertThrows(BadRequestException.class,
                () -> entrevueService.respondToInterviewInvitation(INTERVIEW_ID, acceptDto, request));
        verify(interviewRepository, never()).save(any());
    }
    @Test
    void respondToInterview_alreadyResponded_throwsConflict() {
        when(jwtTokenProvider.getEmailFromJWT(TOKEN)).thenReturn(STUDENT_EMAIL);
        Etudiant student = mock(Etudiant.class);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(student);
        Entrevue interview = createMockInterview(INTERVIEW_ID, student);
        when(interview.getDateInterview()).thenReturn(LocalDateTime.now().plusDays(1));

        when(interview.getInterviewInvitationStatus()).thenReturn(StatutConvocationEntrevue.ACCEPTED);
        when(interviewRepository.findById(INTERVIEW_ID)).thenReturn(Optional.of(interview));
        RepondreConvocationDTO acceptDto = new RepondreConvocationDTO(StatutConvocationEntrevue.ACCEPTED, null);
        assertThrows(ConflictException.class,
                () -> entrevueService.respondToInterviewInvitation(INTERVIEW_ID, acceptDto, request));
        verify(interviewRepository, never()).save(any());
    }

    private Entrevue createMockInterview(Long interviewId, Etudiant student) {
        Entrevue interview = mock(Entrevue.class);
        Employeur employer = mock(Employeur.class);
        OffreDeStage offer = mock(OffreDeStage.class);

        lenient().when(interview.getId()).thenReturn(interviewId);
        lenient().when(interview.getStudent()).thenReturn(student);
        lenient().when(interview.getEmployer()).thenReturn(employer);
        lenient().when(interview.getInternshipOffer()).thenReturn(offer);
        lenient().when(employer.getId()).thenReturn(EMPLOYER_ID);
        lenient().when(offer.getId()).thenReturn(OFFER_ID);
        lenient().when(interview.getDateInterview()).thenReturn(LocalDateTime.now().plusDays(2));
        lenient().when(interview.getModeInterview()).thenReturn(ModeEntrevue.VIDEO_CALL);
        lenient().when(interview.getLocationOrLink()).thenReturn("https://meet.google.com");
        lenient().when(interview.getMessage()).thenReturn("Message");

        return interview;
    }

}
