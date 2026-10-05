package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CVDTO;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private DocumentService documentService;

    private MockMultipartFile fileCV;
    private MockMultipartFile fileOffre;
    private String formContentCV;
    private String formContentOffre;
    private MockHttpServletRequest request;
    private Etudiant etudiant;
    private Employeur employeur;

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
                    "position": "Développeur Java",
                    "descriptionPosition": "Développement d'une application Spring Boot",
                    "dateDebutStage": "2026-06-01",
                    "dateFintStage": "2026-08-31",
                    "adresseEntreprise": "Montréal",
                    "salaire": 25.0,
                    "targetDiscipline": "INFORMATIQUE"
                }
                """;

        request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer fake-jwt");

        etudiant = Etudiant.builder()
                .email("test@example.com")
                .nom("Doe")
                .prenom("John")
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        employeur = Employeur.builder()
                .email("employeur@example.com")
                .nom("Entreprise")
                .prenom("Test")
                .build();
    }

    @Test
    @DisplayName("saveDocument - should save a CV successfully")
    public void testSaveDocumentCVSuccess() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.existsByFileNameAndTargetDiscipline("cv.pdf", Disciplines.INFORMATIQUE)).thenReturn(false);

        DocumentDTO result = documentService.saveDocument(fileCV, formContentCV, request);

        assertNotNull(result);
        assertInstanceOf(CVDTO.class, result);
        verify(jwtTokenProvider).getEmailFromJWT("fake-jwt");
        verify(utilisateurService).findEntityByEmail("test@example.com");
        verify(documentRepository).existsByFileNameAndTargetDiscipline("cv.pdf", Disciplines.INFORMATIQUE);
        verify(documentRepository).save(any(CV.class));
    }

    @Test
    @DisplayName("saveDocument - should throw BadRequestException when document already exists")
    public void testSaveDocumentDuplicate() throws NotFoundException, BadRequestException, IOException {

        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);
        when(documentRepository.existsByFileNameAndTargetDiscipline("cv.pdf", Disciplines.INFORMATIQUE)).thenReturn(true);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> documentService.saveDocument(fileCV, formContentCV, request));
        assertEquals("Document with the same name and target discipline already exists", exception.getMessage());
        verify(documentRepository).existsByFileNameAndTargetDiscipline("cv.pdf", Disciplines.INFORMATIQUE);
        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("saveDocument - should save an OffreDeStage successfully")
    public void testSaveDocumentOffreSuccess() throws NotFoundException, BadRequestException, IOException {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("employeur@example.com");
        when(utilisateurService.findEntityByEmail("employeur@example.com")).thenReturn(employeur);
        when(documentRepository.existsByFileNameAndTargetDiscipline("offre.pdf", Disciplines.INFORMATIQUE)).thenReturn(false);

        DocumentDTO result = documentService.saveDocument(fileOffre, formContentOffre, request);

        assertNotNull(result);
        assertInstanceOf(OffreDeStageDTO.class, result);
        verify(jwtTokenProvider).getEmailFromJWT("fake-jwt");
        verify(utilisateurService).findEntityByEmail("employeur@example.com");
        verify(documentRepository).existsByFileNameAndTargetDiscipline("offre.pdf", Disciplines.INFORMATIQUE);
        verify(documentRepository).save(any(OffreDeStage.class));
    }

    @Test
    @DisplayName("saveDocument - should throw BadRequestException for invalid document type")
    public void testSaveDocumentInvalidType() throws NotFoundException {
        String invalidFormContent = "{\"type\":\"InvalidType\"}";
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("test@example.com");
        when(utilisateurService.findEntityByEmail("test@example.com")).thenReturn(etudiant);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> documentService.saveDocument(fileCV, invalidFormContent, request));
        assertEquals("Invalid document type", exception.getMessage());
        verify(documentRepository, never()).save(any());
        verify(documentRepository, never()).existsByFileNameAndTargetDiscipline(anyString(), any());
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
    public void testToDTOWithOffreDeStage() throws NotFoundException {
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
}
