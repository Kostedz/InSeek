package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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

    private MockMultipartFile file;
    private MockMultipartFile formContent;

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
                "{\"type\":\"CV\",\"email\":\"bib@a.com\",\"targetDiscipline\":\"INFORMATIQUE\"}".getBytes()
        );
    }


    @Test
    @DisplayName("Upload document CV par POST /documents/upload - Success")
    void uploadDocument() throws Exception {
        when(documentService.saveDocument(
                file,
                "{\"type\":\"CV\",\"email\":\"bib@a.com\",\"targetDiscipline\":\"INFORMATIQUE\"}"
        )).thenReturn(null);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - BadRequestException")
    void uploadDocumentBadRequest() throws Exception {
        when(documentService.saveDocument(any(MultipartFile.class), anyString()))
                .thenThrow(new BadRequestException("Bad request"));

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - NotFoundException")
    void uploadDocumentNotFound() throws Exception {
        when(documentService.saveDocument(any(MultipartFile.class), anyString()))
                .thenThrow(new NotFoundException("Document not found"));

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Upload document CV par POST /documents/upload - IOException")
    void uploadDocumentIOException() throws Exception {
        when(documentService.saveDocument(any(MultipartFile.class), anyString()))
                .thenThrow(new IOException("IO error"));

        mockMvc.perform(MockMvcRequestBuilders.multipart("/documents/upload")
                        .file(file)
                        .file(formContent))
                .andExpect(status().isInternalServerError());
    }
}
