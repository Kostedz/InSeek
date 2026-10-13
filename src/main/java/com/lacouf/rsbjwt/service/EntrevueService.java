package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
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

    public EntrevueDTO scheduleInterview(Long employerId, CreateEntrevueDTO interviewDTO) throws BadRequestException, NotFoundException {
        validateRequiredFields(interviewDTO);
        validateFutureDate(interviewDTO);

        Employeur employer = findEmployer(employerId);
        Etudiant student = findStudent(interviewDTO.studentId());
        OffreDeStage internshipOffer = findInternshipOffer(interviewDTO.offerId());

        Entrevue interview = createInterview(employer, student, internshipOffer, interviewDTO);

        updateStudent(student, interviewDTO);

        return mapToDTO(interview);


    }

    //est executé toutes les heures pour vérifier les entrevues passées et mettre à jour le statut de l'étudiant si nécessaire
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void checkPastInterviews(){
        List<Entrevue> pastInterviews = interviewRepository.findByDateInterviewBefore(LocalDateTime.now());
        for (Entrevue interview : pastInterviews) {
            Etudiant student = interview.getStudent();
            if(student.getStatutRecherche() == StatutRechercheEtudiant.INVITED_TO_INTERVIEW){
                student.setStatutRecherche(StatutRechercheEtudiant.WAITING_FOR_RESPONSE);
                userRepository.save(student);
            }
        }
    }

    private void validateRequiredFields(CreateEntrevueDTO InterviewDTO) {
        if (InterviewDTO.studentId() == null || InterviewDTO.offerId() == null ||
                InterviewDTO.DateAndTime() == null || InterviewDTO.mode() == null ||
                InterviewDTO.locationOrLink() == null || InterviewDTO.message() == null) {
            throw new IllegalArgumentException("tous les champs sont obligatoires.");
        }
    }

    private void validateFutureDate(CreateEntrevueDTO InterviewDTO) {
        if (InterviewDTO.DateAndTime().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("La date et l'heure de l'entrevue doivent être dans le futur.");
        }
    }

    private Employeur findEmployer(Long employerId) {
        return (Employeur) userRepository.findById(employerId)
                .orElseThrow(() -> new IllegalArgumentException("Employeur non trouvé."));
    }

    private Etudiant findStudent(Long studentId) {
        return (Etudiant) userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Étudiant non trouvé"));
    }

    private OffreDeStage findInternshipOffer(Long offerId) {
        return documentRepository.findOffreStageById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre de stage non trouvée."));
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
        student.setDateEnterview(InterviewDTO.DateAndTime());
        student.setStatutRecherche(StatutRechercheEtudiant.INVITED_TO_INTERVIEW);
    }

    private EntrevueDTO mapToDTO(Entrevue interview) {
        return EntrevueDTO.builder()
                .id(interview.getId())
                .employerId(interview.getEmployer().getId())
                .studentId(interview.getStudent().getId())
                .offerId(interview.getInternshipOffer().getId())
                .DateAndTime(interview.getDateInterview())
                .mode(interview.getModeInterview())
                .locationOrLink(interview.getLocationOrLink())
                .message(interview.getMessage())
                .build();
    }
}
