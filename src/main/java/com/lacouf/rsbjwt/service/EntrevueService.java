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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntrevueService {

    private final EntrevueRepository interviewRepository;
    private final UtilisateurRepository userRepository;
    private final DocumentRepository documentRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public EntrevueDTO scheduleInterview(HttpServletRequest request, CreateEntrevueDTO interviewDTO) throws BadRequestException, NotFoundException {
        validateRequiredFields(interviewDTO);
        validateFutureDate(interviewDTO);

        String employerEmail = getEmailFromRequest(request);

        Employeur employer = findEmployerByEmail(employerEmail);
        Etudiant student = findStudent(interviewDTO.studentId());
        OffreDeStage internshipOffer = findInternshipOffer(interviewDTO.offerId());

        Entrevue interview = interviewRepository
                .findByStudentIdAndInternshipOfferId(student.getId(), internshipOffer.getId())
                .orElse(null);

        if (interview != null) {
            if (interview.getInterviewInvitationStatus() != StatutConvocationEntrevue.EXPIRED
                    && !(interview.getInterviewInvitationStatus() == StatutConvocationEntrevue.PENDING
                    && interview.getDateInterview().isBefore(LocalDateTime.now()))) {
                throw new BadRequestException("Une entrevue a déjà été plannifiée pour cet étudiant et cette offre de stage.");
            }
            if (!interview.getEmployer().getId().equals(employer.getId())) {
                throw new BadRequestException("Vous ne pouvez pas remplacer cette entrevue.");
            }
            interview.setDateInterview(interviewDTO.DateAndTime());
            interview.setModeInterview(interviewDTO.mode());
            interview.setLocationOrLink(interviewDTO.locationOrLink());
            interview.setMessage(interviewDTO.message());
            interview.setInterviewInvitationStatus(StatutConvocationEntrevue.PENDING);
            interview.setInvitationResponseDate(null);
            interview.setMessageWhenRejected(null);
            interview = interviewRepository.save(interview);
        } else {
            interview = createInterview(employer, student, internshipOffer, interviewDTO);
        }

       updateStudent(student, interviewDTO);

        return EntrevueDTO.of(interview);


    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void checkPastInterviews(){
        LocalDateTime now = LocalDateTime.now();
        List<Entrevue> pastInterviews = interviewRepository.findByDateInterviewBefore(now);
        for (Entrevue interview : pastInterviews) {
            Etudiant student = interview.getStudent();
            if (interview.getInterviewInvitationStatus() == StatutConvocationEntrevue.PENDING) {
                interview.setInterviewInvitationStatus(StatutConvocationEntrevue.EXPIRED);
                interviewRepository.save(interview);
            }
            if(interview.getInterviewInvitationStatus() == StatutConvocationEntrevue.ACCEPTED && student.getStatutRecherche() == StatutRechercheEtudiant.INVITED_TO_INTERVIEW){
                student.setStatutRecherche(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
                userRepository.save(student);
            }
        }
    }

    @Transactional
    public EntrevueDTO updateInterview(HttpServletRequest request, CreateEntrevueDTO dto) throws BadRequestException, NotFoundException {
        validateRequiredFields(dto);
        validateFutureDate(dto);

        String employerEmail = jwtTokenProvider.getEmailFromJWT(request.getHeader("Authorization").substring(7));
        Employeur employer = findEmployerByEmail(employerEmail);

        Entrevue interview = interviewRepository
                .findByStudentIdAndInternshipOfferId(dto.studentId(), dto.offerId())
                .orElseThrow(() -> new NotFoundException("Entrevue non trouvée."));

        if (!interview.getEmployer().getId().equals(employer.getId())) {
            throw new BadRequestException("Vous ne pouvez pas modifier cette entrevue.");
        }

        interview.setDateInterview(dto.DateAndTime());
        interview.setModeInterview(dto.mode());
        interview.setLocationOrLink(dto.locationOrLink());
        interview.setMessage(dto.message());

        updateStudent(interview.getStudent(), dto);

        return EntrevueDTO.of(interviewRepository.save(interview));
    }

    public List<EntrevueDTO> getInterviewsForStudent(HttpServletRequest request) throws NotFoundException {
        String studentEmail = getEmailFromRequest(request);
        Etudiant student = findStudentByEmail(studentEmail);

        if (student == null) {
            throw new NotFoundException("Étudiant non trouvé.");
        }
        return interviewRepository.findByStudentId(student.getId())
                .stream()
                .map(EntrevueDTO::of)
                .toList();
    }

    public EntrevueDTO getInterviewDetails(Long interviewId, HttpServletRequest request) throws NotFoundException, BadRequestException {
        String studentEmail = getEmailFromRequest(request);
        Etudiant student = findStudentByEmail(studentEmail);
        Entrevue interview = findInterview(interviewId);

        validateInterviewOwnership(interview, student);

        return EntrevueDTO.of(interview);
    }

    @Transactional
    public EntrevueDTO respondToInterviewInvitation(Long interviewId, RepondreConvocationDTO repondreConvocationDTO, HttpServletRequest request) throws NotFoundException, BadRequestException, ConflictException {
        validateInvitationStatus(repondreConvocationDTO);

        String studentEmail = getEmailFromRequest(request);

        Etudiant student = findStudentByEmail(studentEmail);
        Entrevue interview = findInterview(interviewId);

        validateInterviewOwnership(interview, student);
        validateInvitationExpiration(interview);
        validateInvitationAlreadyResponded(interview);

        updateInterviewResponse(interview, repondreConvocationDTO);

        if (repondreConvocationDTO.interviewInvitationStatus() == StatutConvocationEntrevue.REJECTED) {
            handleInterviewInvitationRejection(interview, repondreConvocationDTO, student);
        }

        Entrevue saved = interviewRepository.save(interview);

        //TODO: envoi d'un email de confirmation à l'étudiant et à l'employeur

        return EntrevueDTO.of(saved);
    }

    private String getEmailFromRequest(HttpServletRequest request) {
        return jwtTokenProvider.getEmailFromJWT(
                request.getHeader("Authorization").substring(7)
        );
    }

    private void validateRequiredFields(CreateEntrevueDTO InterviewDTO) throws BadRequestException{
        if (InterviewDTO.studentId() == null || InterviewDTO.offerId() == null ||
                InterviewDTO.DateAndTime() == null || InterviewDTO.mode() == null ||
                InterviewDTO.locationOrLink() == null) {
            throw new BadRequestException("tous les champs sont obligatoires.");
        }
    }

    private void validateFutureDate(CreateEntrevueDTO InterviewDTO) throws BadRequestException{
        if (InterviewDTO.DateAndTime().isBefore(java.time.LocalDateTime.now())) {
            throw new BadRequestException("La date et l'heure de l'entrevue doivent être dans le futur.");
        }
    }

    private void validateInterviewOwnership(Entrevue interview, Etudiant student) throws BadRequestException {
        if (!interview.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("Accès refusé à cette convocation.");
        }
    }

    private void validateInvitationStatus(RepondreConvocationDTO repondreConvocationDTO) throws BadRequestException {
        if (repondreConvocationDTO.interviewInvitationStatus() == null ||
                repondreConvocationDTO.interviewInvitationStatus() == StatutConvocationEntrevue.PENDING) {
            throw new BadRequestException("Le statut doit être ACCEPTEE ou REFUSEE.");
        }
    }

    private void validateInvitationExpiration(Entrevue interview) throws BadRequestException {
        if (interview.getDateInterview().isBefore(LocalDateTime.now())) {
            interview.setInterviewInvitationStatus(StatutConvocationEntrevue.EXPIRED);
            throw new BadRequestException("La date de cette convocation est déjà passée. Vous ne pouvez plus y répondre.");
        }
    }

    private void validateInvitationAlreadyResponded(Entrevue interview) throws ConflictException {
        if (interview.getInterviewInvitationStatus() != StatutConvocationEntrevue.PENDING) {
            throw new ConflictException("Vous avez déjà répondu à cette convocation.");
        }
    }

    private Employeur findEmployerByEmail(String email) throws NotFoundException {
        Utilisateur user = userRepository.findByEmail(email);
        if (user == null || !(user instanceof Employeur)) {
            throw new NotFoundException("Employeur non trouvé.");
        }
        return  (Employeur) user;
    }

    private Etudiant findStudent(Long studentId) throws NotFoundException {
        return userRepository.findById(studentId)
                .filter(Etudiant.class::isInstance)
                .map(Etudiant.class::cast)
                .orElseThrow(() -> new NotFoundException("Étudiant non trouvé"));
    }

    private Etudiant findStudentByEmail(String email) throws NotFoundException {
        Utilisateur user = userRepository.findByEmail(email);
        if (user == null || !(user instanceof Etudiant etudiant)) {
            throw new NotFoundException("Étudiant non trouvé.");
        }
        return etudiant;
    }

    private OffreDeStage findInternshipOffer(Long offerId) throws NotFoundException {
        return documentRepository.findOffreStageById(offerId)
                .orElseThrow(() -> new NotFoundException("Offre de stage non trouvée."));
    }

    private Entrevue findInterview(Long interviewId) throws NotFoundException {
        return interviewRepository.findById(interviewId)
                .orElseThrow(() -> new NotFoundException("Convocation non trouvée."));
    }

    private Entrevue createInterview(
            Employeur employer,
            Etudiant student,
            OffreDeStage offer,
            CreateEntrevueDTO InterviewDTO) {

        Entrevue interview = Entrevue.builder()
                .employer(employer)
                .student(student)
                .internshipOffer(offer)
                .dateInterview(InterviewDTO.DateAndTime())
                .modeInterview(InterviewDTO.mode())
                .locationOrLink(InterviewDTO.locationOrLink())
                .message(InterviewDTO.message())
                .build();

        return interviewRepository.save(interview);
    }

    private void updateStudent(Etudiant student, CreateEntrevueDTO InterviewDTO) {
        student.setDateInterview(InterviewDTO.DateAndTime());
        student.setStatutRecherche(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);
    }

    private void updateInterviewResponse(Entrevue interview, RepondreConvocationDTO repondreConvocationDTO) {
        interview.setInterviewInvitationStatus(repondreConvocationDTO.interviewInvitationStatus()); ;
        interview.setInvitationResponseDate(LocalDateTime.now());
    }

    private void handleInterviewInvitationRejection(Entrevue interview, RepondreConvocationDTO repondreConvocationDTO, Etudiant student) {
        interview.setMessageWhenRejected(repondreConvocationDTO.messageWhenRejected());
        student.setDateInterview(null);
        student.setStatutRecherche(StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP);
        userRepository.save(student);
    }
}
