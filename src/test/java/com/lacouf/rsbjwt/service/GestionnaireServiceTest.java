package com.lacouf.rsbjwt.service;
import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
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

    private Document cv;

    private OffreDeStage offre;
    private Utilisateur utilisateur;
    @BeforeEach
    void setUp() {
        utilisateur = mock(Utilisateur.class);
        lenient().when(utilisateur.getEmail()).thenReturn("test@inseek.com");
        cv = new CV();
        cv.setId(1L);
        cv.setStatut(StatutValidation.EN_ATTENTE);
        cv.setUtilisateur(utilisateur);
        cv.setFileName("mon_cv.pdf");
        offre = new OffreDeStage();
        offre.setId(2L);
        offre.setStatut(StatutValidation.EN_ATTENTE);
        offre.setUtilisateur(utilisateur);
        offre.setFileName("offre_stage.pdf");
    }

    // TESTS POUR listPendingDocuments
    @Test
    void listPendingDocuments_quandTypeEstCV_retourneListeCV() {
        when(documentRepository.findCVByStatut(StatutValidation.EN_ATTENTE)).thenReturn(List.of(cv));
        List<DocumentValidationDTO> result = gestionnaireService.listPendingDocuments("CV");
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).id());
        verify(documentRepository).findCVByStatut(StatutValidation.EN_ATTENTE);
        verify(documentRepository, never()).findOffreDeStageByStatut(any());
    }
    @Test
    void listPendingDocuments_quandTypeEstOffre_retourneListeOffres() {
        when(documentRepository.findOffreDeStageByStatut(StatutValidation.EN_ATTENTE)).thenReturn(List.of(offre));
        List<DocumentValidationDTO> result = gestionnaireService.listPendingDocuments("OffreDeStage");
        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).id());
        verify(documentRepository).findOffreDeStageByStatut(StatutValidation.EN_ATTENTE);
        verify(documentRepository, never()).findCVByStatut(any());
    }
    @Test
    void listPendingDocuments_quandTypeInvalide_lanceIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> {
            gestionnaireService.listPendingDocuments("TYPE_INCONNU");
        });
    }

    // TESTS POUR approveDocument
    @Test
    void approveDocument_succes() throws Exception {
        when(documentRepository.findById(1L)).thenReturn(Optional.of(cv));
        DocumentValidationDTO result = gestionnaireService.approveDocument(1L);
        assertEquals(StatutValidation.VALIDE, cv.getStatut());
        assertEquals(StatutValidation.VALIDE, result.statut());
        verify(documentRepository).save(cv);
    }
    @Test
    void approveDocument_quandDocumentIntrouvable_lanceNotFoundException() {
        when(documentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> {
            gestionnaireService.approveDocument(99L);
        });
    }
    @Test
    void approveDocument_quandDocumentDejaTraite_lanceBadRequestException() {
        cv.setStatut(StatutValidation.VALIDE); // Le document n'est plus EN_ATTENTE
        when(documentRepository.findById(1L)).thenReturn(Optional.of(cv));
        assertThrows(BadRequestException.class, () -> {
            gestionnaireService.approveDocument(1L);
        });
    }

    // TESTS POUR rejectDocument
    @Test
    void rejectDocument_succes() throws Exception {
        when(documentRepository.findById(1L)).thenReturn(Optional.of(cv));
        String commentaire = "Le document n'est pas conforme.";
        DocumentValidationDTO result = gestionnaireService.rejectDocument(1L, commentaire);
        assertEquals(StatutValidation.REJETE, cv.getStatut());
        assertEquals(commentaire, cv.getCommentaireRejet());
        assertEquals(StatutValidation.REJETE, result.statut());
        assertEquals(commentaire, result.commentaireRejet());
        verify(documentRepository).save(cv);
    }
    @Test
    void rejectDocument_quandCommentaireEstNullOuVide_lanceBadRequestException() {
        assertThrows(BadRequestException.class, () -> {
            gestionnaireService.rejectDocument(1L, null);
        });
        assertThrows(BadRequestException.class, () -> {
            gestionnaireService.rejectDocument(1L, "   ");
        });
    }
    @Test
    void rejectDocument_quandDocumentDejaTraite_lanceBadRequestException() {
        cv.setStatut(StatutValidation.REJETE);
        when(documentRepository.findById(1L)).thenReturn(Optional.of(cv));
        assertThrows(BadRequestException.class, () -> {
            gestionnaireService.rejectDocument(1L, "Un commentaire valide");
        });
    }
}