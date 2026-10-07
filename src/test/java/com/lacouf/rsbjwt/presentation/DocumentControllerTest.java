package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
public class DocumentControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    DocumentService documentService;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    AuthService authService;

    private MockMultipartFile file;
    private MockMultipartFile formContent;
    private String jwt;

    @BeforeEach
    void setUp() {
        file = new MockMultipartFile(
                "file",
                "cv.pdf",
                "application/pdf",
                "Dummy CV content".getBytes()
        );

        formContent = new MockMultipartFile(
                "formContent",
                "",
                "application/json",
                "{\"type\":\"CV\"}".getBytes()
        );

        jwt = "test-jwt-token";
    }


    @Test
    @DisplayName("Upload document CV par POST /documents/upload - Success")
    void uploadDocument() throws Exception {
        when(documentService.saveDocument(
                any(MultipartFile.class),
                eq("{\"type\":\"CV\"}"),
                any(HttpServletRequest.class)
        )).thenReturn(null);

        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Upload document OffreDeStage par POST /documents/upload - Success")
    void uploadOfferDocument() throws Exception {
        String offerForm = """
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
        MockMultipartFile offerFormContent = new MockMultipartFile(
                "formContent", "", "application/json", offerForm.getBytes());

        when(documentService.saveDocument(
                any(MultipartFile.class),
                eq(offerForm),
                any(HttpServletRequest.class)
        )).thenReturn(null);
        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(offerFormContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - BadRequestException")
    void uploadDocumentBadRequest() throws Exception {
        when(documentService.saveDocument(
                any(MultipartFile.class),
                eq("{\"type\":\"CV\"}"),
                any(HttpServletRequest.class)
        )).thenThrow(new BadRequestException("Invalid request"));

        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - NotFoundException")
    void uploadDocumentNotFound() throws Exception {
        when(documentService.saveDocument(
                any(MultipartFile.class),
                eq("{\"type\":\"CV\"}"),
                any(HttpServletRequest.class)
        )).thenThrow(new NotFoundException("Document not found"));

        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - IOException")
    void uploadDocumentIOException() throws Exception {
        when(documentService.saveDocument(
                any(MultipartFile.class),
                eq("{\"type\":\"CV\"}"),
                any(HttpServletRequest.class)
        )).thenThrow(new IOException("IO error"));

        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isInternalServerError());

    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - Invalid JWT")
    void uploadDocumentInvalidJwt() throws Exception {
        when(authService.validateJwt(any(HttpServletRequest.class))).thenReturn(false);
        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Lister les offres de l'employeur par GET /employeur/offres - Success")
    void listEmployerOffers() throws Exception {
        when(documentService.findOffersForEmployer(any(HttpServletRequest.class)))
                .thenReturn(List.of(offerDto()));

        mockMvc.perform(MockMvcRequestBuilders.get("/employeur/offres")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Mettre à jour une offre par PUT /employeur/offres/{id} - Success")
    void updateEmployerOffer() throws Exception {
        String offerForm = """
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
        MockMultipartFile offerFormContent = new MockMultipartFile(
                "formContent", "", "application/json", offerForm.getBytes());

        when(documentService.saveEmployerOffer(any(MultipartFile.class), eq(offerForm), any(), eq(17L)))
                .thenReturn(offerDto());

        mockMvc.perform(MockMvcRequestBuilders.multipart("/employeur/offres/17")
                        .file(file)
                        .file(offerFormContent)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    private OffreDeStageDTO offerDto() {
        return new OffreDeStageDTO(
                17L,
                "offer.pdf",
                "employer@example.com",
                "Example Company",
                "Java intern",
                "Build backend features",
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 8, 31),
                "Montreal",
                com.lacouf.rsbjwt.model.StatutValidation.EN_ATTENTE,
                null,
                25.0,
                com.lacouf.rsbjwt.model.Disciplines.INFORMATIQUE,
                null,
                null,
                1,
                null
        );
    }
}
