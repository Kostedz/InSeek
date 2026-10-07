package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.GestionnaireService;
import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
import com.lacouf.rsbjwt.service.dto.RejeterDocumentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/gestionnaire")
public class GestionnaireController {
    private final GestionnaireService gestionnaireService;

    @GetMapping("/documents/pending")
    public ResponseEntity<List<DocumentValidationDTO>> listPendingDocuments() {
        List<DocumentValidationDTO> pendingDocuments = gestionnaireService.listPendingDocuments();
        return ResponseEntity.ok(pendingDocuments);
    }

    @PutMapping("/documents/{documentId}/approve")
    public ResponseEntity<DocumentValidationDTO> approveDocument(@PathVariable Long documentId) {
        try {
            return ResponseEntity.ok(gestionnaireService.approveDocument(documentId));
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/documents/{documentId}/reject")
    public ResponseEntity<DocumentValidationDTO> rejectDocument(@PathVariable Long documentId, @RequestBody RejeterDocumentDTO rejeterDocumentDTO) {
        try{
            return ResponseEntity.ok(gestionnaireService.rejectDocument(documentId, rejeterDocumentDTO.commentaire()));
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

}
