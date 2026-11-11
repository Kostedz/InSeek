package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final ContratRepository contractRepository;
    private final EtudiantRepository studentRepository;
    private final ProfesseurRepository teacherRepository;
    private final EmployerRepository employerRepository;

    @Transactional
    public EvaluationDTO submitEvaluation(EvaluationDTO dto, String userEmail)
            throws NotFoundException, BadRequestException, ConflictException {
        return switch (dto) {
            case CompanyEvaluationDTO companyDto -> submitCompanyEvaluation(companyDto, userEmail);
            //case StudentEvaluationDTO studentDto -> submitStudentEvaluation(studentDto, userEmail);
            default -> throw new BadRequestException("Type d'évaluation non reconnu.");
        };
    }

    @Transactional(readOnly = true)
    public PrefillCompanyEvaluationDTO getPreFillCompanyEvaluation(String teacherEmail, Long studentId) throws NotFoundException, BadRequestException {
        Professeur teacher = findTeacherByEmail(teacherEmail);
        Etudiant student = findStudentAssignedToTeacher(studentId, teacher);
        Contract activeContract = findActiveContract(studentId);
        return new PrefillCompanyEvaluationDTO(
                teacher.getId(),
                teacher.getPrenom() + " " + teacher.getNom(),
                student.getId(),
                student.getPrenom() + " " + student.getNom(),
                activeContract.getEmployer() != null ? activeContract.getEmployer().getId() : null,
                activeContract.getEmployer() != null ? activeContract.getEmployer().getNomCompagnie() : "",
                activeContract.getSupervisorName() != null ? activeContract.getSupervisorName() : "",
                activeContract.getInternshipOffer() != null ? activeContract.getInternshipOffer().getId() : null,
                activeContract.getInternshipOffer() != null ? activeContract.getInternshipOffer().getPosition() : "",
                activeContract.getId(),
                activeContract.getStartingDate(),
                activeContract.getEndingDate(),
                student.getDiscipline()
        );
    }

    @Transactional(readOnly = true)
    public PrefillStudentEvaluationDTO getPrefillStudentEvaluation(String employerEmail, Long studentId) throws NotFoundException, BadRequestException{
        Employeur employer = findEmployerByEmail(employerEmail);
        Etudiant student = findStudentById(studentId);
        Contract activeContract = findContractForStudentAndEmployer(studentId,employer);
        return new PrefillStudentEvaluationDTO(
                employer.getId(),
                employer.getPrenom() + " " + employer.getNom(),
                employer.getNomCompagnie(),
                studentId,
                student.getPrenom() + " " + student.getNom(),
                activeContract.getInternshipOffer().getId(),
                activeContract.getInternshipOffer().getPosition(),
                activeContract.getId(),
                activeContract.getStartingDate(),
                activeContract.getEndingDate(),
                student.getDiscipline()
        );
    }

    @Transactional(readOnly = true)
    public CompanyEvaluationDTO getSubmittedCompanyEvaluation(String teacherEmail, Long studentId) throws NotFoundException, BadRequestException {
        Professeur teacher = findTeacherByEmail(teacherEmail);
        findStudentAssignedToTeacher(studentId, teacher);
        Contract activeContract = findActiveContract(studentId);

        return evaluationRepository.findCompanyEvaluation(teacher.getId(), studentId, activeContract.getId())
                .map(CompanyEvaluationDTO::of)
                .orElseThrow(() -> new NotFoundException("Aucune évaluation trouvée pour cet étudiant."));
    }

    private CompanyEvaluationDTO submitCompanyEvaluation(CompanyEvaluationDTO companyEvaluationDTO, String teacherEmail)
            throws NotFoundException, BadRequestException, ConflictException {
        Professeur teacher = findTeacherByEmail(teacherEmail);
        Etudiant student = findStudentAssignedToTeacher(companyEvaluationDTO.studentId(), teacher);
        Contract activeContract = findActiveContract(companyEvaluationDTO.studentId());

        if (evaluationRepository.existsCompanyEvaluationByContractAndEvaluationState(
                activeContract.getId(), EvaluationState.SUBMITTED)) {
            throw new ConflictException("Une évaluation du milieu de stage a déjà été soumise pour ce contrat.");
        }

        validateCompanyEvaluationSubmission(companyEvaluationDTO, activeContract);

        CompanyEvaluation evaluation = buildEvaluation(companyEvaluationDTO, teacher, student, activeContract);
        evaluation.setEvaluationState(EvaluationState.SUBMITTED);
        evaluation.setEvaluationSubmittedDate(LocalDate.now());

        return CompanyEvaluationDTO.of(evaluationRepository.save(evaluation));
    }

    //private StudentEvaluationDTO submitStudentEvaluation(StudentEvaluationDTO dto, String employerEmail) {}

    private CompanyEvaluation buildEvaluation(CompanyEvaluationDTO companyEvaluationDTO, Professeur teacher,
                                              Etudiant student, Contract activeContract) {
        CompanyEvaluation evaluation = new CompanyEvaluation();
        evaluation.setTeacher(teacher);
        evaluation.setStudentIntern(student);
        evaluation.setContract(activeContract);
        evaluation.setEmployerCompany(activeContract.getEmployer());
        evaluation.setInternshipOffer(activeContract.getInternshipOffer());
        evaluation.setDiscipline(student.getDiscipline());
        evaluation.setVisitDate(companyEvaluationDTO.visitDate());
        evaluation.setEvaluationComment(companyEvaluationDTO.evaluationComment());
        evaluation.setSupervisionRating(companyEvaluationDTO.supervisionRating());
        evaluation.setTaskComplianceRating(companyEvaluationDTO.taskComplianceRating());
        evaluation.setWorkEnvironmentRating(companyEvaluationDTO.workEnvironmentRating());
        return evaluation;
    }

    private void validateCompanyEvaluationSubmission(CompanyEvaluationDTO companyEvaluationDTO, Contract contract)
            throws BadRequestException {
        if (companyEvaluationDTO.visitDate() == null) {
            throw new BadRequestException("La date de visite est obligatoire.");
        }
        if (companyEvaluationDTO.visitDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("La date de visite ne peut pas être dans le futur.");
        }
        if (contract.getStartingDate() != null && companyEvaluationDTO.visitDate().isBefore(contract.getStartingDate())) {
            throw new BadRequestException("La date de visite ne peut pas être antérieure au début du stage.");
        }
        if (contract.getEndingDate() != null && companyEvaluationDTO.visitDate().isAfter(contract.getEndingDate())) {
            throw new BadRequestException("La date de visite ne peut pas être postérieure à la fin du stage.");
        }
        validateRating("supervisionRating", companyEvaluationDTO.supervisionRating());
        validateRating("taskComplianceRating", companyEvaluationDTO.taskComplianceRating());
        validateRating("workEnvironmentRating", companyEvaluationDTO.workEnvironmentRating());
    }

    private void validateRating(String fieldName, double rating) throws BadRequestException {
        if (rating < 1.0 || rating > 5.0) {
            throw new BadRequestException("Le champ " + fieldName + " doit être compris entre 1.0 et 5.0.");
        }
    }

    private Professeur findTeacherByEmail(String email) throws NotFoundException {
        return teacherRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Professeur introuvable."));
    }

    /// --------------------------------
    private Employeur findEmployerByEmail(String email) throws NotFoundException{
        return employerRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Employeur introuvable."));
    }

    private Etudiant findStudentById(Long id) throws NotFoundException{
        return studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Etudiant introuvable."));
    }

    private Etudiant findStudentAssignedToTeacher(Long studentId, Professeur teacher) throws NotFoundException {
        Etudiant student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Étudiant introuvable."));
        if (student.getProfesseur() == null || !student.getProfesseur().getId().equals(teacher.getId())) {
            throw new NotFoundException("Cet étudiant ne vous est pas assigné.");
        }
        return student;
    }

    private Contract findActiveContract(Long studentId) throws BadRequestException {
        return contractRepository.findByStudentIdOrderByDateCreationDesc(studentId).stream()
                .filter(contract -> contract.getContractStatus() == StatutContrat.EXECUTED)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Aucun contrat en cours (EXECUTED) trouvé pour cet étudiant. Le stage doit être actif."));
    }

    /// //////////////////////////////////////////////////////////////////////////////////////
    private void validateStudentEvaluationSubmission(StudentEvaluationDTO studentEvaluationDTO, Contract contract)
            throws BadRequestException {
        if (studentEvaluationDTO.evaluationSubmittedAt() == null) {
            throw new BadRequestException("La date de soumission de l'évaluation est obligatoire.");
        }
        if (contract.getStartingDate() != null && studentEvaluationDTO.evaluationSubmittedAt().isBefore(contract.getStartingDate())) {
            throw new BadRequestException("La date de soumission de l'évaluation ne peut pas être antérieure au début du stage.");
        }/*
        if (contract.getEndingDate() != null && studentEvaluationDTO.evaluationSubmittedAt().isBefore(contract.getEndingDate())) {
            throw new BadRequestException("La date de soumission de l'évaluation de l'étudiant doit être après la fin du stage.");
        }*/
        validateRating("professionalismRating", studentEvaluationDTO.professionalismRating());
        validateRating("workQualityRating", studentEvaluationDTO.workQualityRating());
        validateRating("teamworkRating", studentEvaluationDTO.teamworkRating());
        validateRating("communicationRating", studentEvaluationDTO.communicationRating());
        validateRating("objectiveReachedRating", studentEvaluationDTO.objectiveReachedRating());
    }

    private Contract findContractForStudentAndEmployer(
            Long studentId, Employeur employer)
            throws NotFoundException {

        return contractRepository
                .findByStudentIdOrderByDateCreationDesc(studentId)
                .stream()
                .filter(contract ->
                        contract.getEmployer() != null
                                && contract.getEmployer().getId().equals(employer.getId()))
                .findFirst()
                .orElseThrow(() ->
                        new NotFoundException(
                                "Aucun contrat trouvé entre cet étudiant et votre entreprise."));
    }
}
