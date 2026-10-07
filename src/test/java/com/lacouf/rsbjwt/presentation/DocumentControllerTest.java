package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
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


}
