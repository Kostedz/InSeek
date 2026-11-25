package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.event.NotificationEvent;
import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.document.CV;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.Gestionnaire;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CVDTO;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ApplicationStageRepository applicationStageRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private DocumentService documentService;

    private MockMultipartFile fileCV;
    private MockMultipartFile fileOffre;
    private String formContentCV;
    private String formContentOffre;
    private MockHttpServletRequest request;
    private Etudiant etudiant;
    private Employeur employeur;
    private Gestionnaire gestionnaire;

    @BeforeEach
    public void setUp() {
        fileCV = new MockMultipartFile(
                "file",
                "cv.pdf",
                "application/pdf",
                "Dummy CV content".getBytes()
        );

        fileOffre = new MockMultipartFile(
                "file",
                "offre.pdf",
                "application/pdf",
                "Dummy Offre content".getBytes()
        );

        formContentCV = "{\"type\":\"CV\"}";

        formContentOffre = """
                {
                    "type": "OffreDeStage",
                    "nomEntreprise": "Example Company",
                    "position": "Développeur Java",
                    "descriptionPosition": "Développement d'une application Spring Boot",
                    "dateDebutStage": "2026-06-01",
                    "dateFinStage": "2026-08-31",
                    "adresseEntreprise": "Montréal",
                    "salaire": 25.0,
                    "targetDiscipline": "INFORMATIQUE"
                }
                """;

        request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer fake-jwt");

        etudiant = Etudiant.builder()
                .id(1L)
                .email("test@example.com")
                .nom("Doe")
                .prenom("John")
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        employeur = Employeur.builder()
                .id(2L)
                .email("employeur@example.com")
                .nom("Entreprise")
                .prenom("Test")
                .build();

        gestionnaire = new Gestionnaire(
                3L,
                "Dev",
                "InSeek",
                "dev@inseek.local",
                "password"
        );
    }

    @Test
    @DisplayName("saveDocument - should save a CV successfully and notify managers")
    public void testSaveDocumentCVSuccess() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(utilisateurRepository.findAll()).thenReturn(List.of(gestionnaire));

        DocumentDTO result = documentService.saveDocument(fileCV, formContentCV, request);

        assertNotNull(result);
        assertInstanceOf(CVDTO.class, result);
        verify(jwtTokenProvider).getEmailFromJWT("fake-jwt");
        verify(utilisateurService).findEntityByEmail("test@example.com");
        verify(documentRepository).save(any(CV.class));
        verify(eventPublisher).publishEvent(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("saveDocument - should replace existing rejected CV and flag notification as corrected")
    public void testSaveDocumentCVReplacesRejectedCV() throws NotFoundException, BadRequestException, IOException {
        CV oldCv = CV.builder()
                .id(10L)
                .utilisateur(etudiant)
                .build();
        oldCv.setStatut(StatutValidation.REJETE);

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(oldCv);
        when(utilisateurRepository.findAll()).thenReturn(List.of(gestionnaire));

        DocumentDTO result = documentService.saveDocument(fileCV, formContentCV, request);

        assertNotNull(result);
        verify(documentRepository).delete(oldCv);
        verify(documentRepository).flush();
        verify(documentRepository).save(any(CV.class));
        verify(eventPublisher).publishEvent(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("saveDocument - should allow the development manager to submit a CV")
    public void testSaveDocumentCvAsDevelopmentManager() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("dev@inseek.local");
        when(utilisateurService.findEntityByEmail("dev@inseek.local")).thenReturn(gestionnaire);

        DocumentDTO result = documentService.saveDocument(fileCV, formContentCV, request);

        assertInstanceOf(CVDTO.class, result);
        verify(documentRepository).save(any(CV.class));
    }

    @Test
    @DisplayName("saveDocument - should allow manager to specify target discipline in CV")
    public void testSaveDocumentCvAsManagerWithSpecificDiscipline() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("dev@inseek.local");
        when(utilisateurService.findEntityByEmail("dev@inseek.local")).thenReturn(gestionnaire);

        String formWithDiscipline = "{\"type\":\"CV\", \"targetDiscipline\":\"INFORMATIQUE\"}";
        DocumentDTO result = documentService.saveDocument(fileCV, formWithDiscipline, request);

        assertInstanceOf(CVDTO.class, result);
        verify(documentRepository).save(any(CV.class));
    }

    @Test
    @DisplayName("saveDocument - should reject manager submitting CV with invalid discipline")
    public void testSaveDocumentCvAsManagerInvalidDiscipline() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("dev@inseek.local");
        when(utilisateurService.findEntityByEmail("dev@inseek.local")).thenReturn(gestionnaire);

        String formInvalid = "{\"type\":\"CV\", \"targetDiscipline\":\"DISCIPLINE_INEXISTANTE\"}";

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> documentService.saveDocument(fileCV, formInvalid, request));
        assertEquals("Discipline de CV invalide", ex.getMessage());
    }

    @Test
    @DisplayName("saveDocument - should reject non-student and non-manager submitting CV")
    public void testSaveDocumentCvAsEmployerRejected() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> documentService.saveDocument(fileCV, formContentCV, request));
        assertEquals("Seul un étudiant ou le compte développeur peut téléverser un CV", ex.getMessage());
    }

    @Test
    @DisplayName("saveDocument - should delegate OffreDeStage type to saveEmployerOffer")
    public void testSaveDocumentOffreSuccess() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);

        DocumentDTO result = documentService.saveDocument(fileOffre, formContentOffre, request);

        assertNotNull(result);
        assertInstanceOf(OffreDeStageDTO.class, result);
        verify(documentRepository).save(any(OffreDeStage.class));
    }

    @Test
    @DisplayName("saveDocument - should throw BadRequestException for invalid document type")
    public void testSaveDocumentInvalidType() {
        String invalidFormContent = "{\"type\":\"InvalidType\"}";

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> documentService.saveDocument(fileCV, invalidFormContent, request)
        );

        assertEquals("Invalid document type", exception.getMessage());
        verify(documentRepository, never()).save(any());
    }


    @Test
    @DisplayName("validateFile - should throw BadRequestException when file is empty or null")
    public void testValidateFileEmptyOrNull() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "cv.pdf", "application/pdf", new byte[0]);
        BadRequestException ex1 = assertThrows(BadRequestException.class, () -> documentService.validateFile(emptyFile));
        assertEquals("File is empty", ex1.getMessage());

        BadRequestException ex2 = assertThrows(BadRequestException.class, () -> documentService.validateFile(null));
        assertEquals("File is empty", ex2.getMessage());
    }

    @Test
    @DisplayName("validateFile - should throw BadRequestException when file exceeds 5 MB")
    public void testValidateFileExceedsLimit() {
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile largeFile = new MockMultipartFile("file", "cv.pdf", "application/pdf", largeBytes);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> documentService.validateFile(largeFile));
        assertEquals("File size exceeds the maximum limit of 5 MB", ex.getMessage());
    }

    @Test
    @DisplayName("validateFile - should throw BadRequestException when file is not a PDF")
    public void testValidateFileNotPdf() {
        MockMultipartFile textFile = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());

        BadRequestException ex = assertThrows(BadRequestException.class, () -> documentService.validateFile(textFile));
        assertEquals("Only PDF files are allowed", ex.getMessage());
    }


    @Test
    @DisplayName("getAuthenticatedUser - should reject missing or invalid Authorization header")
    public void testGetAuthenticatedUserMissingOrInvalidAuthHeader() {
        MockHttpServletRequest requestWithoutAuth = new MockHttpServletRequest();
        assertThrows(BadRequestException.class, () -> documentService.findStagesByDiscipline(requestWithoutAuth));

        MockHttpServletRequest requestWithInvalidAuth = new MockHttpServletRequest();
        requestWithInvalidAuth.addHeader("Authorization", "Basic abc");
        assertThrows(BadRequestException.class, () -> documentService.findStagesByDiscipline(requestWithInvalidAuth));
    }


    @Test
    @DisplayName("findStudentCv - should return CV validation DTO when student has a CV")
    public void testFindStudentCvSuccess() throws NotFoundException, BadRequestException {
        CV cv = CV.builder()
                .id(1L)
                .fileName("cv.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .data("cv data".getBytes())
                .contentType("application/pdf")
                .size(10L)
                .utilisateur(etudiant)
                .build();
        cv.setStatut(StatutValidation.VALIDE);

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(cv);

        DocumentValidationDTO result = documentService.findStudentCv(request);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("test@example.com", result.email());
    }

    @Test
    @DisplayName("findStudentCv - should return null when student has no CV")
    public void testFindStudentCvNotFound() throws NotFoundException, BadRequestException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(null);

        DocumentValidationDTO result = documentService.findStudentCv(request);

        assertNull(result);
    }

    @Test
    @DisplayName("findStudentCv - should throw BadRequestException if requester is not student")
    public void testFindStudentCvNonStudent() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> documentService.findStudentCv(request));
        assertEquals("Seul un étudiant peut consulter son CV", ex.getMessage());
    }


    @Test
    @DisplayName("findDocumentFile - should throw NotFoundException when document does not exist")
    public void testFindDocumentFileDocNotFound() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> documentService.findDocumentFile(99L, request));
    }

    @Test
    @DisplayName("findDocumentFile - should allow access to manager")
    public void testFindDocumentFileAsManager() throws NotFoundException, BadRequestException {
        CV cv = CV.builder().id(5L).data("data".getBytes()).contentType("application/pdf").utilisateur(etudiant).build();
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("dev@inseek.local");
        when(utilisateurService.findEntityByEmail("dev@inseek.local")).thenReturn(gestionnaire);
        when(documentRepository.findById(5L)).thenReturn(Optional.of(cv));

        DocumentService.DocumentFile file = documentService.findDocumentFile(5L, request);

        assertNotNull(file);
        assertArrayEquals("data".getBytes(), file.data());
    }

    @Test
    @DisplayName("findDocumentFile - should allow access to owner of the document")
    public void testFindDocumentFileAsOwner() throws NotFoundException, BadRequestException {
        CV cv = CV.builder().id(5L).data("data".getBytes()).contentType("application/pdf").utilisateur(etudiant).build();
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findById(5L)).thenReturn(Optional.of(cv));

        DocumentService.DocumentFile file = documentService.findDocumentFile(5L, request);

        assertNotNull(file);
        assertArrayEquals("data".getBytes(), file.data());
    }

    @Test
    @DisplayName("findDocumentFile - should allow access to student with validated CV viewing valid offer")
    public void testFindDocumentFileStudentWithValidatedCv() throws NotFoundException, BadRequestException {
        OffreDeStage offer = OffreDeStage.builder()
                .id(12L)
                .data("offer".getBytes())
                .contentType("application/pdf")
                .employeur(employeur)
                .build();
        offer.setStatut(StatutValidation.VALIDE);

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findById(12L)).thenReturn(Optional.of(offer));
        when(documentRepository.existsStudentCvByStatut(etudiant, StatutValidation.VALIDE)).thenReturn(true);

        DocumentService.DocumentFile file = documentService.findDocumentFile(12L, request);

        assertNotNull(file);
        assertArrayEquals("offer".getBytes(), file.data());
    }

    @Test
    @DisplayName("findDocumentFile - should allow employer viewing applicant's validated CV")
    public void testFindDocumentFileEmployerWithApplicantCv() throws NotFoundException, BadRequestException {
        CV cv = CV.builder().id(5L).data("data".getBytes()).contentType("application/pdf").utilisateur(etudiant).build();
        cv.setStatut(StatutValidation.VALIDE);

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findById(5L)).thenReturn(Optional.of(cv));
        when(applicationStageRepository.existsByEtudiantIdAndEmployerId(1L, 2L)).thenReturn(true);

        DocumentService.DocumentFile file = documentService.findDocumentFile(5L, request);

        assertNotNull(file);
        assertArrayEquals("data".getBytes(), file.data());
    }

    @Test
    @DisplayName("findDocumentFile - should reject unauthorized user")
    public void testFindDocumentFileUnauthorized() throws NotFoundException {
        Employeur otherEmployer = Employeur.builder().id(9L).email("other@example.com").build();
        CV cv = CV.builder().id(5L).data("data".getBytes()).contentType("application/pdf").utilisateur(etudiant).build();
        cv.setStatut(StatutValidation.EN_ATTENTE);

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("other@example.com");
        when(utilisateurService.findEntityByEmail("other@example.com")).thenReturn(otherEmployer);
        when(documentRepository.findById(5L)).thenReturn(Optional.of(cv));

        assertThrows(NotFoundException.class, () -> documentService.findDocumentFile(5L, request));
    }

    @Test
    @DisplayName("findOffersForEmployer - should return approved offers when no auth header is present")
    public void testFindOffersForEmployerNoAuthHeader() throws NotFoundException, BadRequestException {
        MockHttpServletRequest requestNoAuth = new MockHttpServletRequest();
        OffreDeStage approvedOffer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        approvedOffer.setStatut(StatutValidation.VALIDE);

        when(documentRepository.findByStatut(StatutValidation.VALIDE)).thenReturn(List.of(approvedOffer));

        List<OffreDeStageDTO> result = documentService.findOffersForEmployer(requestNoAuth);

        assertEquals(1, result.size());
        assertEquals(1L, result.getFirst().id());
    }

    @Test
    @DisplayName("findOffersForEmployer - should return only the employer's offers")
    public void testFindOffersForEmployer() throws NotFoundException, BadRequestException {
        OffreDeStage offer = OffreDeStage.builder()
                .id(17L)
                .fileName("offer.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .employeur(employeur)
                .position("Développeur Java")
                .descriptionPosition("Développement Spring Boot")
                .dateDebutStage(LocalDate.now())
                .dateFinStage(LocalDate.now().plusDays(30))
                .adresseEntreprise("Montréal")
                .build();
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findOffersByEmployer(employeur)).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffersForEmployer(request);

        assertEquals(1, result.size());
        assertEquals(17L, result.getFirst().id());
        verify(documentRepository).findOffersByEmployer(employeur);
    }

    @Test
    @DisplayName("saveEmployerOffer - should throw BadRequestException if employer has a pending document")
    public void testSaveEmployerOfferDuplicatePending() throws NotFoundException {
        CV existingPending = CV.builder().id(1L).build();
        existingPending.setStatut(StatutValidation.EN_ATTENTE);
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findByUtilisateur(employeur)).thenReturn(existingPending);
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> documentService.saveEmployerOffer(fileOffre, formContentOffre, request, null));
        assertEquals("Document with the same name and target discipline already exists", ex.getMessage());
    }

    @Test
    @DisplayName("saveEmployerOffer - should throw NotFoundException when updating non-existent offer")
    public void testUpdateEmployerOfferNotFound() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> documentService.saveEmployerOffer(fileOffre, formContentOffre, request, 99L));
    }

    @Test
    @DisplayName("saveEmployerOffer - should throw NotFoundException when updating offer not owned by employer")
    public void testUpdateEmployerOfferNotOwner() throws NotFoundException {
        Employeur otherOwner = Employeur.builder().id(9L).email("other@mail.com").build();
        OffreDeStage otherOffer = OffreDeStage.builder().id(17L).employeur(otherOwner).build();

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findById(17L)).thenReturn(Optional.of(otherOffer));

        assertThrows(NotFoundException.class,
                () -> documentService.saveEmployerOffer(fileOffre, formContentOffre, request, 17L));
    }

    @Test
    @DisplayName("saveEmployerOffer - should throw NotFoundException when document to update is not an OffreDeStage")
    public void testUpdateEmployerOfferWrongDocumentType() throws NotFoundException {
        CV cv = CV.builder().id(17L).utilisateur(employeur).build();

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findById(17L)).thenReturn(Optional.of(cv));

        assertThrows(NotFoundException.class,
                () -> documentService.saveEmployerOffer(fileOffre, formContentOffre, request, 17L));
    }

    @Test
    @DisplayName("saveEmployerOffer - should create an offer from the employer form")
    public void testSaveEmployerOffer() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);

        OffreDeStageDTO result = documentService.saveEmployerOffer(fileOffre, formContentOffre, request, null);

        assertEquals("Example Company", result.nomEntreprise());
        assertEquals(StatutValidation.EN_ATTENTE, result.statut());
        verify(documentRepository).save(any(OffreDeStage.class));
    }

    @Test
    @DisplayName("saveEmployerOffer - should accept an authenticated student as offer author")
    public void testSaveOfferForAuthenticatedStudent() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);

        OffreDeStageDTO result = documentService.saveEmployerOffer(fileOffre, formContentOffre, request, null);

        assertEquals("Example Company", result.nomEntreprise());
        assertEquals("test@example.com", result.email());
        verify(documentRepository).save(any(OffreDeStage.class));
    }

    @Test
    @DisplayName("saveEmployerOffer - should update only a validated offer owned by the employer")
    public void testUpdateEmployerOffer() throws NotFoundException, BadRequestException, IOException {
        employeur.setId(7L);
        OffreDeStage offer = OffreDeStage.builder()
                .id(17L)
                .fileName("old.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .employeur(employeur)
                .position("Ancien titre")
                .descriptionPosition("Ancienne description suffisamment longue")
                .dateDebutStage(LocalDate.now())
                .dateFinStage(LocalDate.now().plusDays(30))
                .adresseEntreprise("Montréal")
                .build();
        offer.setStatut(StatutValidation.VALIDE);
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.findById(17L)).thenReturn(Optional.of(offer));

        String form = """
                {
                    "type": "OffreDeStage",
                    "nomEntreprise": "Example Company",
                    "position": "Nouveau titre",
                    "descriptionPosition": "Une nouvelle description suffisamment longue",
                    "dateDebutStage": "2026-06-01",
                    "dateFinStage": "2026-08-31",
                    "adresseEntreprise": "Montréal",
                    "salaire": 25.0,
                    "targetDiscipline": "INFORMATIQUE"
                }
                """;

        OffreDeStageDTO result = documentService.saveEmployerOffer(fileOffre, form, request, 17L);

        assertEquals("Nouveau titre", result.position());
        assertEquals(StatutValidation.EN_ATTENTE, result.statut());
        assertEquals(2, result.version());
        verify(documentRepository).save(offer);
    }


    @Test
    @DisplayName("toDTO - should convert CV to CVDTO")
    public void testToDTOWithCV() {
        CV cv = CV.builder()
                .fileName("cv.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .data("CV content".getBytes())
                .contentType("application/pdf")
                .size(10L)
                .utilisateur(etudiant)
                .build();

        DocumentDTO result = documentService.toDTO(cv);

        assertNotNull(result);
        assertInstanceOf(CVDTO.class, result);
    }

    @Test
    @DisplayName("toDTO - should convert OffreDeStage to OffreDeStageDTO")
    public void testToDTOWithOffreDeStage() {
        OffreDeStage offre = OffreDeStage.builder()
                .fileName("offre.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .data("Offre content".getBytes())
                .contentType("application/pdf")
                .size(15L)
                .employeur(employeur)
                .position("Développeur Java")
                .descriptionPosition("Développement Spring Boot")
                .dateDebutStage(LocalDate.now())
                .dateFinStage(LocalDate.now().plusDays(30))
                .adresseEntreprise("123 Rue de la Paix, Paris")
                .salaire(2500.0)
                .build();

        DocumentDTO result = documentService.toDTO(offre);

        assertNotNull(result);
        assertInstanceOf(OffreDeStageDTO.class, result);
    }

    @Test
    @DisplayName("toDTO - should throw IllegalArgumentException for unknown document type")
    public void testToDTOUnknownType() {
        Document unknownDoc = mock(Document.class);
        assertThrows(IllegalArgumentException.class, () -> documentService.toDTO(unknownDoc));
    }


    @Test
    @DisplayName("findStagesByDiscipline - should return stages matching student's discipline")
    public void testFindStagesByDiscipline() throws NotFoundException, BadRequestException {
        OffreDeStage offer = OffreDeStage.builder()
                .id(17L)
                .fileName("offer.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .employeur(employeur)
                .position("Développeur Java")
                .descriptionPosition("Développement Spring Boot")
                .dateDebutStage(LocalDate.now())
                .dateFinStage(LocalDate.now().plusDays(30))
                .adresseEntreprise("Montréal")
                .build();

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.findOffreStageByTargetDiscipline(Disciplines.INFORMATIQUE))
                .thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findStagesByDiscipline(request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(17L, result.getFirst().id());
    }

    @Test
    @DisplayName("findStagesByDiscipline - should reject a non-student user")
    public void testFindStagesByDisciplineNonStudent() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> documentService.findStagesByDiscipline(request)
        );

        assertEquals("Seul un étudiant peut consulter les stages par discipline", exception.getMessage());
    }

    @Test
    @DisplayName("findStagesByDiscipline - should reject an unauthenticated user")
    public void testFindStagesByDisciplineUnauthenticated() throws NotFoundException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("unknown@example.com");
        when(utilisateurService.findEntityByEmail("unknown@example.com")).thenReturn(null);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> documentService.findStagesByDiscipline(request)
        );

        assertEquals("Utilisateur non authentifié", exception.getMessage());
    }

    @Test
    @DisplayName("findStagesBySession - should return stages for given session")
    public void testFindStagesBySession() {
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findBySession("A2026")).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findStagesBySession("A2026");

        assertEquals(1, result.size());
        assertEquals(1L, result.getFirst().id());
    }


    @Test
    @DisplayName("findAllOffreDeStage - should return approved offer summaries")
    public void testFindAllOffreDeStage() {
        OffreDeStageDTO dto = new OffreDeStageDTO(1L, "offre.pdf", "employeur@example.com","Example Company", "Développeur Java","Description du stage",null,null,"Montréal", StatutValidation.VALIDE,null,25.0, Disciplines.INFORMATIQUE,null,null, 1,null);
        when(documentRepository.findOffreStageSummariesByStatut(StatutValidation.VALIDE)).thenReturn(List.of(dto));

        List<OffreDeStageDTO> result = documentService.findAllOffreDeStage();
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findAllOffreStageSummaries - should return all summaries")
    public void testFindAllOffreStageSummaries() {
        OffreDeStageDTO dto = new OffreDeStageDTO(1L, "offre.pdf", "employeur@example.com","Example Company", "Développeur Java","Description du stage",null,null,"Montréal", StatutValidation.VALIDE,null,25.0, Disciplines.INFORMATIQUE,null,null, 1,null);
        when(documentRepository.findAllOffreStageSummaries()).thenReturn(List.of(dto));

        List<OffreDeStageDTO> result = documentService.findAllOffreStageSummaries();
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageById - should return offer when found")
    public void testFindOffreDeStageByIdFound() {
        OffreDeStageDTO dto = new OffreDeStageDTO(5L, "offre.pdf", "employeur@example.com","Example Company", "Développeur Java","Description du stage",null,null,"Montréal", StatutValidation.VALIDE,null,25.0, Disciplines.INFORMATIQUE,null,null, 1,null);
        when(documentRepository.findOffreStageSummaryById(5L)).thenReturn(Optional.of(dto));

        OffreDeStageDTO result = documentService.findOffreDeStageById(5L);
        assertEquals(5L, result.id());
    }

    @Test
    @DisplayName("findOffreDeStageById - should throw RuntimeException when not found")
    public void testFindOffreDeStageByIdNotFound() {
        when(documentRepository.findOffreStageSummaryById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> documentService.findOffreDeStageById(99L));
        assertEquals("Stage n'a pas été trouvé", ex.getMessage());
    }

    @Test
    @DisplayName("findOffreDeStageByCompagnieName - should return offers matching company name")
    public void testFindOffreDeStageByCompagnieName() {
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Google")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStagedByNomCompagnie("Google")).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageByCompagnieName("Google");
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageDiscipline - should return offers matching discipline")
    public void testFindOffreDeStageDiscipline() {
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStageByTargetDiscipline(Disciplines.INFORMATIQUE)).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageDiscipline(Disciplines.INFORMATIQUE);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageByPosition - should return offers matching position")
    public void testFindOffreDeStageByPosition() {
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStageByPosition("Dev")).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageByPosition("Dev");
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageByMinimumSalaire - should return offers with salary >= minimum")
    public void testFindOffreDeStageByMinimumSalaire() {
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStageByMinimumSalaire(20.0)).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageByMinimumSalaire(20.0);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageByDateDebutStage - should return offers matching start date")
    public void testFindOffreDeStageByDateDebutStage() {
        LocalDate date = LocalDate.of(2026, 6, 1);
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStageByDateDebutStage(date)).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageByDateDebutStage(date);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("findOffreDeStageByDateFinStage - should return offers matching end date")
    public void testFindOffreDeStageByDateFinStage() {
        LocalDate date = LocalDate.of(2026, 8, 31);
        OffreDeStage offer = OffreDeStage.builder()
                .id(1L)
                .nomEntreprise("Example Company")
                .employeur(employeur)
                .build();
        when(documentRepository.findOffreStageByDateFinStage(date)).thenReturn(List.of(offer));

        List<OffreDeStageDTO> result = documentService.findOffreDeStageByDateFinStage(date);
        assertEquals(1, result.size());
    }
}