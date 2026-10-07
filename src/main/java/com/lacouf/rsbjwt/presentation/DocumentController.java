package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@RestController
public class DocumentController {
    private final DocumentService documentService;
    private final AuthService authService;

    @PostMapping("/documents/upload")
    public ResponseEntity<DocumentDTO> uploadDocument(@RequestPart("file") MultipartFile file, @RequestPart("formContent") String formContent, HttpServletRequest request) {
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

    }

    @GetMapping("/documents/stage")
    public ResponseEntity<OffreDeStageDTO> findAllStages(){
        return null;
    }

    @GetMapping("/documents/stage/{id}")
    public OffreDeStageDTO getOffreDeStageById(@PathVariable Long id){
        return null;
    }

    @GetMapping("/documents/stage/{discipline}")
    public ResponseEntity<OffreDeStageDTO> getOffreDeStageByDiscipline(@PathVariable String discipline){
        return null;
    }

    @GetMapping("/documents/stage/{compagnie}")
    public ResponseEntity<OffreDeStageDTO> getOffreDeStageByCompagnie(@PathVariable String compagnie){
        return null;
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
