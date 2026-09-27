package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RequiredArgsConstructor
@RestController
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentDTO> uploadDocument(@RequestPart("file") MultipartFile file, @RequestPart("formContent") String formContent) {
        try {
            if (file.isEmpty()) {
                throw new BadRequestException("File is empty");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("File size exceeds the maximum limit of 5 MB");
            }

            if (!file.getContentType().equals("application/pdf")) {
                throw new BadRequestException("Only PDF files are allowed");
            }

            DocumentDTO savedDocument = documentService.saveDocument(file, formContent);

            return ResponseEntity.ok(savedDocument);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

    }
}
