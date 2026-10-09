package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@RestController
public class DocumentController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    private final DocumentService documentService;
    private final AuthService authService;

    @PostMapping("/documents/upload")
    public ResponseEntity<?> uploadDocument(@RequestPart("file") MultipartFile file, @RequestPart("formContent") String formContent, HttpServletRequest request) {
        try {
            if (!authService.validateJwt(request)) {
                throw new BadRequestException("Invalid JWT token");
            }
            if (file.isEmpty()) {
                throw new BadRequestException("File is empty");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("File size exceeds the maximum limit of 5 MB");
            }

            if (!file.getContentType().equals("application/pdf")) {
                throw new BadRequestException("Only PDF files are allowed");
            }

            DocumentDTO savedDocument = documentService.saveDocument(file, formContent, request);

            return ResponseEntity.ok(savedDocument);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

    }

    @GetMapping("/documents/stage")
    public List<OffreDeStageDTO> findAllStages(){
        return documentService.findAllOffreDeStage();
    }

    @GetMapping("/documents/student/cv")
    public ResponseEntity<DocumentValidationDTO> getStudentCv(HttpServletRequest request) {
        try {
            DocumentValidationDTO cv = documentService.findStudentCv(request);
            return cv == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(cv);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/documents/{documentId}/file")
    public ResponseEntity<byte[]> getDocumentFile(@PathVariable Long documentId, HttpServletRequest request) {
        try {
            DocumentService.DocumentFile document = documentService.findDocumentFile(documentId, request);
            byte[] data = document.data();
            MediaType contentType = MediaType.APPLICATION_PDF;
            if (document.contentType() != null) {
                try {
                    contentType = MediaType.parseMediaType(document.contentType());
                } catch (IllegalArgumentException exception) {
                    logger.warn("Invalid stored content type for document {}: {}. Falling back to application/pdf.",
                            documentId, document.contentType(), exception);
                }
            }
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .contentLength(data == null ? 0 : data.length)
                    .body(data);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/documents/stage/{id}")
    public OffreDeStageDTO getOffreDeStageById(@PathVariable Long id){
        return documentService.findOffreDeStageById(id);
    }

    @GetMapping("/documents/stage/discipline/{discipline}")
    public List<OffreDeStageDTO> getOffreDeStageByDiscipline(@PathVariable Disciplines discipline){
        return documentService.findOffreDeStageDiscipline(discipline);
    }

    @GetMapping("/documents/stage/compagine/{compagnie}")
    public List<OffreDeStageDTO> getOffreDeStageByCompagnie(@PathVariable String compagnie){
        return documentService.findOffreDeStageByCompagnieName(compagnie);
    }

    @GetMapping("/employeur/offres")
    public ResponseEntity<List<OffreDeStageDTO>> listEmployerOffers(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(documentService.findOffersForEmployer(request));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping(value = "/employeur/offres/{offerId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OffreDeStageDTO> updateEmployerOffer(
            @PathVariable Long offerId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("formContent") String formContent,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(documentService.saveEmployerOffer(file, formContent, request, offerId));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
