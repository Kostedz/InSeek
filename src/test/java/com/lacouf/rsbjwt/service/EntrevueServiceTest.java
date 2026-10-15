package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
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

    @InjectMocks
    private EntrevueService entrevueService;

    private static final Long EMPLOYER_ID = 1L;
    private static final Long STUDENT_ID = 2L;
    private static final Long OFFER_ID = 3L;

    // P: wtf, utilise @BeforeEach pour ça
    private static CreateEntrevueDTO dto(Long studentId, Long offerId, LocalDateTime date,
                                         ModeEntrevue mode, String place, String message) {
        return new CreateEntrevueDTO(studentId, offerId, date, mode, place, message);
    }

    private static CreateEntrevueDTO validDto() {
        return dto(STUDENT_ID, OFFER_ID, LocalDateTime.now().plusDays(1),
                ModeEntrevue.VIDEO_CALL, "https://meet.example.com/abc", "Bienvenue");
    }

    @Test
    void scheduleInterview_validData_savesInterviewAndUpdatesStudent() throws Exception {
        Employeur employer = mock(Employeur.class);
        Etudiant student = mock(Etudiant.class);
        OffreDeStage offer = mock(OffreDeStage.class);
        when(employer.getId()).thenReturn(EMPLOYER_ID);
        when(student.getId()).thenReturn(STUDENT_ID);
        when(offer.getId()).thenReturn(OFFER_ID);

        when(userRepository.findById(EMPLOYER_ID)).thenReturn(Optional.of(employer));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(documentRepository.findInternshipOfferById(OFFER_ID)).thenReturn(Optional.of(offer));
        when(interviewRepository.save(any(Entrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateEntrevueDTO request = validDto();
        EntrevueDTO result = entrevueService.scheduleInterview(EMPLOYER_ID, request);

        // Entite sauvegardee
        ArgumentCaptor<Entrevue> captor = ArgumentCaptor.forClass(Entrevue.class);
        verify(interviewRepository).save(captor.capture());
        Entrevue saved = captor.getValue();
        assertSame(employer, saved.getEmployer());
        assertSame(student, saved.getStudent());
        assertSame(offer, saved.getInternshipOffer());
        assertEquals(request.DateAndTime(), saved.getDateInterview());
        assertEquals(request.mode(), saved.getModeInterview());
        assertEquals(request.locationOrLink(), saved.getLocationOrLink());
        assertEquals(request.message(), saved.getMessage());

        // Profil de l'etudiant mis a jour
        verify(student).setDateEnterview(request.DateAndTime());
        verify(student).setStatutRecherche(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);

        // DTO retourne
        assertEquals(EMPLOYER_ID, result.employerId());
        assertEquals(STUDENT_ID, result.studentId());
        assertEquals(OFFER_ID, result.offerId());
        assertEquals(request.DateAndTime(), result.DateAndTime());
        assertEquals(request.mode(), result.mode());
        assertEquals(request.locationOrLink(), result.locationOrLink());
        assertEquals(request.message(), result.message());
    }

    static Stream<CreateEntrevueDTO> invalidDtos() {
        LocalDateTime future = LocalDateTime.now().plusDays(1);
        return Stream.of(
                dto(null, OFFER_ID, future, ModeEntrevue.IN_PERSON, "Salle 101", "msg"),
                dto(STUDENT_ID, null, future, ModeEntrevue.IN_PERSON, "Salle 101", "msg"),
                dto(STUDENT_ID, OFFER_ID, null, ModeEntrevue.IN_PERSON, "Salle 101", "msg"),
                dto(STUDENT_ID, OFFER_ID, future, null, "Salle 101", "msg"),
                dto(STUDENT_ID, OFFER_ID, future, ModeEntrevue.IN_PERSON, null, "msg"),
                dto(STUDENT_ID, OFFER_ID, future, ModeEntrevue.IN_PERSON, "Salle 101", null)
        );
    }

    @ParameterizedTest
    @MethodSource("invalidDtos")
    void scheduleInterview_missingField_throwsIllegalArgument(CreateEntrevueDTO invalid) {
        assertThrows(IllegalArgumentException.class,
                () -> entrevueService.scheduleInterview(EMPLOYER_ID, invalid));

        verifyNoInteractions(interviewRepository, userRepository, documentRepository);
    }

    @Test
    void scheduleInterview_dateInThePast_throwsIllegalArgument() {
        CreateEntrevueDTO past = dto(STUDENT_ID, OFFER_ID, LocalDateTime.now().minusHours(1),
                ModeEntrevue.VIDEO_CALL, "https://meet.example.com/abc", "cliquez ici pour rejoindre");

        assertThrows(IllegalArgumentException.class,
                () -> entrevueService.scheduleInterview(EMPLOYER_ID, past));

        verifyNoInteractions(interviewRepository, userRepository, documentRepository);
    }

    @Test
    void scheduleInterview_employerNotFound_throwsIllegalArgument() {
        when(userRepository.findById(EMPLOYER_ID)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> entrevueService.scheduleInterview(EMPLOYER_ID, validDto()));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void scheduleInterview_studentNotFound_throwsIllegalArgument() {
        when(userRepository.findById(EMPLOYER_ID)).thenReturn(Optional.of(mock(Employeur.class)));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> entrevueService.scheduleInterview(EMPLOYER_ID, validDto()));

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void scheduleInterview_offerNotFound_throwsIllegalArgument() {
        when(userRepository.findById(EMPLOYER_ID)).thenReturn(Optional.of(mock(Employeur.class)));
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(mock(Etudiant.class)));
        when(documentRepository.findInternshipOfferById(OFFER_ID)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> entrevueService.scheduleInterview(EMPLOYER_ID, validDto()));

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
