package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.CandidatureService;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.dto.CandidatureDTO;
import com.lacouf.rsbjwt.service.dto.RefuserCandidatureDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/employeur/candidatures")
public class CandidatureController {
    private final CandidatureService candidatureService;

    @GetMapping
    public ResponseEntity<?> lister(@RequestParam(required = false) Long offreId,
                                    HttpServletRequest request) {
        try {
            List<CandidatureDTO> result = candidatureService.listerCandidatures(offreId, request);
            return ResponseEntity.ok(result);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(candidatureService.getCandidature(id, request));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{id}/cv")
    public ResponseEntity<byte[]> cv(@PathVariable Long id, HttpServletRequest request) {
        try {
            DocumentService.DocumentFile file = candidatureService.getCvCandidature(id, request);
            byte[] data = file.data();
            MediaType type = MediaType.APPLICATION_PDF;
            if (file.contentType() != null) {
                try {
                    type = MediaType.parseMediaType(file.contentType());
                } catch (IllegalArgumentException ignored) {
                    // on garde application/pdf
                }
            }
            return ResponseEntity.ok()
                    .contentType(type)
                    .contentLength(data == null ? 0 : data.length)
                    .body(data);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accepter(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(candidatureService.accepter(id, request));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> refuser(@PathVariable Long id,
                                     @RequestBody RefuserCandidatureDTO dto,
                                     HttpServletRequest request) {
        try {
            return ResponseEntity.ok(candidatureService.refuser(id, dto.commentaire(), request));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}