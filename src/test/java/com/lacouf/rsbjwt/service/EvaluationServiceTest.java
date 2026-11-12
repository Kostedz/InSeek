package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.repository.EvaluationRepository;
import com.lacouf.rsbjwt.repository.ProfesseurRepository;
import com.lacouf.rsbjwt.service.dto.CompanyEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.EvaluationDTO;
import com.lacouf.rsbjwt.service.dto.PrefillCompanyEvaluationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class EvaluationServiceTest {

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ContratRepository contractRepository;

    @Mock
    private EtudiantRepository studentRepository;

    @Mock
    private ProfesseurRepository teacherRepository;

    @InjectMocks
    private EvaluationService evaluationService;

    private Professeur teacher;
    private Etudiant student;
    private Employeur employer;
    private OffreDeStage offer;
    private Contract activeContract;
    private CompanyEvaluation companyEvaluation;
    private CompanyEvaluationDTO companyEvaluationDTO;

    private final String TEACHER_EMAIL = "professeur@college.ca";
    private final Long TEACHER_ID = 10L;
    private final Long STUDENT_ID = 1L;
    private final Long CONTRACT_ID = 100L;
    private final Long OFFER_ID = 50L;
    private final Long EMPLOYER_ID = 20L;

    @BeforeEach
    void setUp() {
        teacher = Professeur.builder()
                .id(TEACHER_ID)
                .prenom("Martin")
                .nom("Tremblay")
                .email(TEACHER_EMAIL)
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        student = Etudiant.builder()
                .id(STUDENT_ID)
                .prenom("Alex")
                .nom("Bouchard")
                .email("alex@mail.com")
                .discipline(Disciplines.INFORMATIQUE)
                .build();
        student.setProfesseur(teacher);

        employer = Employeur.builder()
                .id(EMPLOYER_ID)
                .nomCompagnie("CGI")
                .build();

        offer = new OffreDeStage();
        offer.setId(OFFER_ID);
        offer.setPosition("Développeur Java");

        activeContract = Contract.builder()
                .student(student)
                .employer(employer)
                .internshipOffer(offer)
                .teacher(teacher)
                .supervisorName("Sophie Lavoie")
                .startingDate(LocalDate.now().minusMonths(2))
                .endingDate(LocalDate.now().plusMonths(1))
                .contractStatus(StatutContrat.EXECUTED)
                .build();
        activeContract.setId(CONTRACT_ID);

        companyEvaluation = new CompanyEvaluation();
        companyEvaluation.setEvaluationId(200L);
        companyEvaluation.setTeacher(teacher);
        companyEvaluation.setStudentIntern(student);
        companyEvaluation.setContract(activeContract);
        companyEvaluation.setEmployerCompany(employer);
        companyEvaluation.setInternshipOffer(offer);
        companyEvaluation.setDiscipline(Disciplines.INFORMATIQUE);
        companyEvaluation.setVisitDate(LocalDate.now().minusWeeks(1));
        companyEvaluation.setEvaluationComment("Très bon stage.");
        companyEvaluation.setSupervisionRating(4.5);
        companyEvaluation.setTaskComplianceRating(4.0);
        companyEvaluation.setWorkEnvironmentRating(5.0);
        companyEvaluation.setEvaluationState(EvaluationState.SUBMITTED);
        companyEvaluation.setEvaluationSubmittedDate(LocalDate.now());

        companyEvaluationDTO = new CompanyEvaluationDTO(
                null,
                STUDENT_ID,
                CONTRACT_ID,
                OFFER_ID,
                4.5,
                4.0,
                5.0,
                LocalDate.now().minusWeeks(1),
                Disciplines.INFORMATIQUE,
                "Très bon stage.",
                null,
                null
        );

        when(teacherRepository.findByEmail(TEACHER_EMAIL)).thenReturn(Optional.of(teacher));
        when(studentRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(contractRepository.findByStudentIdOrderByDateCreationDesc(STUDENT_ID))
                .thenReturn(List.of(activeContract));
        when(evaluationRepository.existsCompanyEvaluationByContractAndEvaluationState(CONTRACT_ID, EvaluationState.SUBMITTED))
                .thenReturn(false);
        when(evaluationRepository.save(any(CompanyEvaluation.class))).thenReturn(companyEvaluation);
    }

    @Test
    @DisplayName("submitEvaluation avec CompanyEvaluationDTO valide - Success")
    void submitEvaluationSuccess() throws Exception {
        EvaluationDTO result = evaluationService.submitEvaluation(companyEvaluationDTO, TEACHER_EMAIL);
        assertNotNull(result);
        assertInstanceOf(CompanyEvaluationDTO.class, result);
        CompanyEvaluationDTO submitted = (CompanyEvaluationDTO) result;
        assertEquals(200L, submitted.evaluationId());
        assertEquals(STUDENT_ID, submitted.studentId());
        verify(evaluationRepository).save(any(CompanyEvaluation.class));
    }
    @Test
    @DisplayName("submitEvaluation avec type inconnu - BadRequestException")
    void submitEvaluationTypeInconnu() {
        EvaluationDTO dummyDTO = mock(EvaluationDTO.class);
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> evaluationService.submitEvaluation(dummyDTO, TEACHER_EMAIL));
        assertEquals("Type d'évaluation non reconnu.", ex.getMessage());
    }
    @Test
    @DisplayName("submitEvaluation avec professeur introuvable - NotFoundException")
    void submitEvaluationProfesseurNotFound() {
        when(teacherRepository.findByEmail(TEACHER_EMAIL)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class,
                () -> evaluationService.submitEvaluation(companyEvaluationDTO, TEACHER_EMAIL));
    }
    @Test
    @DisplayName("submitEvaluation avec étudiant non assigné - NotFoundException")
    void submitEvaluationEtudiantNonAssigne() {
        student.setProfesseur(null);
        assertThrows(NotFoundException.class,
                () -> evaluationService.submitEvaluation(companyEvaluationDTO, TEACHER_EMAIL));
    }
    @Test
    @DisplayName("submitEvaluation sans contrat actif - BadRequestException")
    void submitEvaluationSansContratActif() {
        when(contractRepository.findByStudentIdOrderByDateCreationDesc(STUDENT_ID)).thenReturn(List.of());
        assertThrows(BadRequestException.class,
                () -> evaluationService.submitEvaluation(companyEvaluationDTO, TEACHER_EMAIL));
    }
    @Test
    @DisplayName("submitEvaluation déjà soumise - ConflictException")
    void submitEvaluationDejaSoumise() {
        when(evaluationRepository.existsCompanyEvaluationByContractAndEvaluationState(CONTRACT_ID, EvaluationState.SUBMITTED))
                .thenReturn(true);
        assertThrows(ConflictException.class,
                () -> evaluationService.submitEvaluation(companyEvaluationDTO, TEACHER_EMAIL));
    }
    @Test
    @DisplayName("submitEvaluation date de visite dans le futur - BadRequestException")
    void submitEvaluationDateVisiteFutur() {
        CompanyEvaluationDTO invalidDTO = new CompanyEvaluationDTO(
                null, STUDENT_ID, CONTRACT_ID, OFFER_ID,
                4.0, 4.0, 4.0, LocalDate.now().plusDays(1), Disciplines.INFORMATIQUE, "Commentaire", null, null
        );
        assertThrows(BadRequestException.class,
                () -> evaluationService.submitEvaluation(invalidDTO, TEACHER_EMAIL));
    }
    @Test
    @DisplayName("submitEvaluation note hors limites (< 1.0 ou > 5.0) - BadRequestException")
    void submitEvaluationNoteInvalide() {
        CompanyEvaluationDTO invalidDTO = new CompanyEvaluationDTO(
                null, STUDENT_ID, CONTRACT_ID, OFFER_ID,
                0.5, 4.0, 4.0, LocalDate.now().minusDays(1), Disciplines.INFORMATIQUE, "Commentaire", null, null
        );
        assertThrows(BadRequestException.class,
                () -> evaluationService.submitEvaluation(invalidDTO, TEACHER_EMAIL));
    }

    @Test
    @DisplayName("getPreFillCompanyEvaluation - Success")
    void getPreFillCompanyEvaluationSuccess() throws Exception {
        PrefillCompanyEvaluationDTO dto = evaluationService.getPreFillCompanyEvaluation(TEACHER_EMAIL, STUDENT_ID);
        assertNotNull(dto);
        assertEquals(TEACHER_ID, dto.teacherId());
        assertEquals("Martin Tremblay", dto.teacherName());
        assertEquals(STUDENT_ID, dto.studentId());
        assertEquals("Alex Bouchard", dto.studentName());
        assertEquals("CGI", dto.companyName());
        assertEquals(CONTRACT_ID, dto.contractId());
    }
    @Test
    @DisplayName("getPreFillCompanyEvaluation avec étudiant introuvable - NotFoundException")
    void getPreFillCompanyEvaluationEtudiantNotFound() {
        when(studentRepository.findById(STUDENT_ID)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class,
                () -> evaluationService.getPreFillCompanyEvaluation(TEACHER_EMAIL, STUDENT_ID));
    }

    @Test
    @DisplayName("getSubmittedCompanyEvaluation - Success")
    void getSubmittedCompanyEvaluationSuccess() throws Exception {
        when(evaluationRepository.findCompanyEvaluation(TEACHER_ID, STUDENT_ID, CONTRACT_ID))
                .thenReturn(Optional.of(companyEvaluation));
        CompanyEvaluationDTO dto = evaluationService.getSubmittedCompanyEvaluation(TEACHER_EMAIL, STUDENT_ID);
        assertNotNull(dto);
        assertEquals(200L, dto.evaluationId());
        assertEquals(STUDENT_ID, dto.studentId());
        assertEquals(EvaluationState.SUBMITTED, dto.evaluationState());
    }
    @Test
    @DisplayName("getSubmittedCompanyEvaluation non trouvée - NotFoundException")
    void getSubmittedCompanyEvaluationNotFound() {
        when(evaluationRepository.findCompanyEvaluation(TEACHER_ID, STUDENT_ID, CONTRACT_ID))
                .thenReturn(Optional.empty());
        assertThrows(NotFoundException.class,
                () -> evaluationService.getSubmittedCompanyEvaluation(TEACHER_EMAIL, STUDENT_ID));
    }
}
