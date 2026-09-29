package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GestionnaireServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private GestionnaireService gestionnaireService;

    private Document cvEnAttente;

    @BeforeEach
    void setUp() {
        cvEnAttente = CV.builder()
                .id(10L)
                .fileName("cv-alice.pdf")
                .targetDiscipline(Disciplines.INFORMATIQUE)
                .email("alice@mail.com")
                .contentType("application/pdf")
                .size(1024)
                .nom("Alice")
                .build();
        cvEnAttente.setStatut(StatutValidation.EN_ATTENTE);
    }

    // TESTER listPendingDocuments()

    @Test
    @DisplayName("listPendingDocuments() retourne la liste des documents en attente")
    void listPendingDocuments_retourneListe() {
        when(documentRepository.findByStatut(StatutValidation.EN_ATTENTE))
                .thenReturn(List.of(cvEnAttente));

        List<DocumentValidationDTO> result = gestionnaireService.listPendingDocuments();

        assertEquals(1, result.size());
        assertEquals(StatutValidation.EN_ATTENTE, result.get(0).statut());
    }

    @Test
    @DisplayName("listPendingDocuments() retourne une liste vide s'il n'y a aucun document en attente")
    void listPendingDocuments_aucunDocument_retourneListeVide() {
        when(documentRepository.findByStatut(StatutValidation.EN_ATTENTE))
                .thenReturn(List.of());

        List<DocumentValidationDTO> result = gestionnaireService.listPendingDocuments();

        assertTrue(result.isEmpty());
    }

    // TESTER approveDocument()

    @Test
    @DisplayName("approveDocument() avec un document en attente change le statut à VALIDE")
    void approveDocument_documentEnAttente_changeStatutValide() throws Exception {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(cvEnAttente));
        when(documentRepository.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));

        DocumentValidationDTO result = gestionnaireService.approveDocument(10L);

        assertEquals(StatutValidation.VALIDE, result.statut());
        verify(documentRepository).save(cvEnAttente);
    }

    @Test
    @DisplayName("approveDocument() avec un document introuvable lève NotFoundException")
    void approveDocument_documentIntrouvable_leveNotFoundException() {
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> gestionnaireService.approveDocument(99L));
        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("approveDocument() sur un document déjà traité lève BadRequestException")
    void approveDocument_documentDejaTraite_leveBadRequestException() {
        cvEnAttente.setStatut(StatutValidation.VALIDE);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(cvEnAttente));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> gestionnaireService.approveDocument(10L));

        assertEquals(
                "Ce document a deja été traité et ne peut pas être approuvé ou rejeté.",
                exception.getMessage());
        verify(documentRepository, never()).save(any());
    }

    // TESTER rejectDocument()

    @Test
    @DisplayName("rejectDocument() avec un commentaire change le statut à REJETE")
    void rejectDocument_avecCommentaire_changeStatutRejete() throws Exception {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(cvEnAttente));
        when(documentRepository.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));

        DocumentValidationDTO result = gestionnaireService.rejectDocument(10L, "Mise en page à revoir");

        assertEquals(StatutValidation.REJETE, result.statut());
        assertEquals("Mise en page à revoir", result.commentaireRejet());
    }

    @Test
    @DisplayName("rejectDocument() sans commentaire (null) lève BadRequestException")
    void rejectDocument_commentaireNull_leveBadRequestException() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> gestionnaireService.rejectDocument(10L, null));

        assertEquals(
                "Un commentaire est requis pour rejeter un document.",
                exception.getMessage());
        verifyNoInteractions(documentRepository);
    }

    @Test
    @DisplayName("rejectDocument() avec un commentaire vide lève BadRequestException")
    void rejectDocument_commentaireVide_leveBadRequestException() {
        assertThrows(BadRequestException.class,
                () -> gestionnaireService.rejectDocument(10L, "   "));

        verifyNoInteractions(documentRepository);
    }

    @Test
    @DisplayName("rejectDocument() avec un document introuvable lève NotFoundException")
    void rejectDocument_documentIntrouvable_leveNotFoundException() {
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> gestionnaireService.rejectDocument(99L, "commentaire valide"));
    }

    @Test
    @DisplayName("rejectDocument() sur un document déjà traité lève BadRequestException")
    void rejectDocument_documentDejaTraite_leveBadRequestException() {
        cvEnAttente.setStatut(StatutValidation.REJETE);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(cvEnAttente));

        assertThrows(BadRequestException.class,
                () -> gestionnaireService.rejectDocument(10L, "nouveau commentaire"));

        verify(documentRepository, never()).save(any());
    }
}

