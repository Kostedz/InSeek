package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EvaluationRepository;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.repository.ProfesseurRepository;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.service.dto.StudentEvaluationDTO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentEvaluationServiceTest {

    @Mock EvaluationRepository evaluationRepository;
    @Mock ContratRepository contractRepository;
    @Mock EtudiantRepository studentRepository;
    @Mock ProfesseurRepository teacherRepository;
    @Mock EmployerRepository employerRepository;

    @InjectMocks EvaluationService service;

    private Employeur employeur;
    private Employeur autreEmployeur;
    private Professeur professeur;
    private Etudiant etudiant;
    private Contract contrat;
    private OffreDeStage offre;

    @BeforeEach
    void setUp() {
        employeur = Employeur.builder()
                .id(1L)
                .nom("Soft")
                .prenom("Ubi")
                .email("ubisoft@mail.com")
                .password("x")
                .nomCompagnie("UbiSoft")
                .build();

        autreEmployeur = Employeur.builder()
                .id(99L)
                .nom("Autre")
                .prenom("Employeur")
                .email("autre@mail.com")
                .password("x")
                .nomCompagnie("Autre compagnie")
                .build();

        professeur = Professeur.builder()
                .id(7L)
                .nom("Gagnon")
                .prenom("Bob")
                .email("bob@mail.com")
                .password("x")
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        etudiant = Etudiant.builder()
                .id(2L)
                .nom("E")
                .prenom("D")
                .email("demo@inseek.local")
                .password("x")
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        etudiant.setProfesseur(professeur);

        offre = new OffreDeStage();
        offre.setId(20L);
        offre.setPosition("Développeur logiciel");

        contrat = Contract.builder()
                .employer(employeur)
                .student(etudiant)
                .internshipOffer(offre)
                .build();
        contrat.setId(10L);
    }

    private StudentEvaluationDTO studentEvaluationDTO() {
        return new StudentEvaluationDTO(
                null,
                null,
                2L,
                null,
                null,
                4.0,
                5.0,
                4.0,
                5.0,
                4.0,
                Disciplines.INFORMATIQUE,
                "Très bon stagiaire",
                null,
                null
        );
    }


    @Test
    void submitsStudentEvaluationSuccessfully() throws Exception {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(studentRepository.findById(2L))
                .thenReturn(Optional.of(etudiant));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));
        when(evaluationRepository.existsStudentEvaluationByContractAndEvaluationState(
                10L, EvaluationState.SUBMITTED))
                .thenReturn(false);
        when(evaluationRepository.save(any(StudentEvaluation.class)))
                .thenAnswer(invocation -> {
                    StudentEvaluation evaluation = invocation.getArgument(0);
                    evaluation.setEvaluationId(5L);
                    return evaluation;
                });

        StudentEvaluationDTO result = (StudentEvaluationDTO) service.submitEvaluation(
                studentEvaluationDTO(), "ubisoft@mail.com");

        assertNotNull(result);
        assertEquals(5L, result.evaluationId());
        assertEquals(2L, result.internId());
        assertEquals(10L, result.contractId());
        assertEquals("Très bon stagiaire", result.evaluationComment());
        assertEquals(EvaluationState.SUBMITTED, result.evaluationState());

        verify(evaluationRepository).save(any(StudentEvaluation.class));
    }

    @Test
    void rejectsRatingBelowOne() {
        StudentEvaluationDTO dto = new StudentEvaluationDTO(
                null, null, 2L, null, null,
                0.0, 5.0, 4.0, 5.0, 4.0,
                Disciplines.INFORMATIQUE, "Commentaire", null, null
        );

        assertThrows(BadRequestException.class,
                () -> service.submitEvaluation(dto, "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsRatingAboveFive() {
        StudentEvaluationDTO dto = new StudentEvaluationDTO(
                null, null, 2L, null, null,
                4.0, 6.0, 4.0, 5.0, 4.0,
                Disciplines.INFORMATIQUE, "Commentaire", null, null
        );

        assertThrows(BadRequestException.class,
                () -> service.submitEvaluation(dto, "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsUserWhoIsNotAnEmployer() {
        when(employerRepository.findByEmail("demo@inseek.local"))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.submitEvaluation(
                        studentEvaluationDTO(), "demo@inseek.local"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsUnknownStudent() {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(studentRepository.findById(2L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.submitEvaluation(
                        studentEvaluationDTO(), "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsStudentWithoutContract() {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(studentRepository.findById(2L))
                .thenReturn(Optional.of(etudiant));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.submitEvaluation(
                        studentEvaluationDTO(), "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsContractOwnedByAnotherEmployer() {
        contrat.setEmployer(autreEmployeur);

        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(studentRepository.findById(2L))
                .thenReturn(Optional.of(etudiant));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));

        assertThrows(NotFoundException.class,
                () -> service.submitEvaluation(
                        studentEvaluationDTO(), "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void rejectsSecondSubmittedEvaluationForSameContract() {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(studentRepository.findById(2L))
                .thenReturn(Optional.of(etudiant));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));
        when(evaluationRepository.existsStudentEvaluationByContractAndEvaluationState(
                10L, EvaluationState.SUBMITTED))
                .thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service.submitEvaluation(
                        studentEvaluationDTO(), "ubisoft@mail.com"));
        verify(evaluationRepository, never()).save(any());
    }

    // ==================== Retrieve submitted student evaluation ====================

    private StudentEvaluation evaluation() {
        StudentEvaluation evaluation = new StudentEvaluation();
        evaluation.setEvaluationId(5L);
        evaluation.setEmployer(employeur);
        evaluation.setIntern(etudiant);
        evaluation.setContract(contrat);
        evaluation.setInternshipOffer(offre);
        evaluation.setDiscipline(Disciplines.INFORMATIQUE);
        evaluation.setEvaluationComment("Très bon stagiaire");
        evaluation.setProfessionalismRating(4.0);
        evaluation.setWorkQualityRating(5.0);
        evaluation.setTeamworkRating(4.0);
        evaluation.setCommunicationRating(5.0);
        evaluation.setObjectiveReachedRating(4.0);
        evaluation.setEvaluationState(EvaluationState.SUBMITTED);
        return evaluation;
    }

    @Test
    void employerRetrievesSubmittedStudentEvaluation() throws Exception {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));
        when(evaluationRepository.findStudentEvaluation(1L, 2L, 10L))
                .thenReturn(Optional.of(evaluation()));

        StudentEvaluationDTO result =
                service.getSubmittedStudentEvaluation("ubisoft@mail.com", 2L);

        assertNotNull(result);
        assertEquals(5L, result.evaluationId());
        assertEquals(1L, result.employerId());
        assertEquals(2L, result.internId());
        assertEquals(10L, result.contractId());
        assertEquals("Très bon stagiaire", result.evaluationComment());
        assertEquals(4.0, result.professionalismRating());
        assertEquals(5.0, result.workQualityRating());
    }

    @Test
    void rejectsRetrievalByAnotherEmployer() {
        when(employerRepository.findByEmail("autre@mail.com"))
                .thenReturn(Optional.of(autreEmployeur));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));

        assertThrows(NotFoundException.class,
                () -> service.getSubmittedStudentEvaluation("autre@mail.com", 2L));

        verify(evaluationRepository, never())
                .findStudentEvaluation(any(), any(), any());
    }

    @Test
    void rejectsRetrievalWhenStudentHasNoContract() {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.getSubmittedStudentEvaluation("ubisoft@mail.com", 2L));

        verify(evaluationRepository, never())
                .findStudentEvaluation(any(), any(), any());
    }

    @Test
    void rejectsRetrievalWhenEvaluationDoesNotExist() {
        when(employerRepository.findByEmail("ubisoft@mail.com"))
                .thenReturn(Optional.of(employeur));
        when(contractRepository.findByStudentId(2L))
                .thenReturn(Optional.of(contrat));
        when(evaluationRepository.findStudentEvaluation(1L, 2L, 10L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.getSubmittedStudentEvaluation("ubisoft@mail.com", 2L));
    }
}
