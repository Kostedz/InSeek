package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.ContratService;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import com.lacouf.rsbjwt.service.dto.ContratDTO;
import com.lacouf.rsbjwt.service.dto.CreateContratDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantEligibleContratDTO;
import com.lacouf.rsbjwt.service.dto.PreRemplirContratDTO;
import com.lacouf.rsbjwt.service.dto.SignatureConfirmationDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/contracts")
public class ContratController {
    private final ContratService contratService;

    @GetMapping("/prefilled/{studentId}/{offerId}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<PreRemplirContratDTO> preFilledContracts(@PathVariable Long studentId,
                                                                   @PathVariable Long offerId) {
        try {
            return ResponseEntity.ok(contratService.getDonneesPreRemplies(studentId, offerId));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/contracts")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<ContratDTO> createContract(@RequestBody CreateContratDTO data,
                                                     HttpServletRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(contratService.creerContrat(data, request));
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<List<ContratDTO>> getContracts() {
        return ResponseEntity.ok(contratService.listerContrats());
    }

    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<ContratDTO> getContract(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contratService.getContrat(id));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/student/me")
    @PreAuthorize("hasAuthority('ETUDIANT')")
    public ResponseEntity<ContratDTO> getMyLatestContract(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(contratService.getContratEtudiant(request));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/student")
    @PreAuthorize("hasAuthority('ETUDIANT')")
    public ResponseEntity<List<ContratDTO>> getStudentContracts(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(contratService.listerContratsEtudiant(request));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/employer")
    @PreAuthorize("hasAuthority('EMPLOYEUR')")
    public ResponseEntity<List<ContratDTO>> getEmployerContracts(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(contratService.listerContratsEmployeur(request));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('GESTIONNAIRE') or hasAuthority('ETUDIANT') or hasAuthority('EMPLOYEUR')")
    public ResponseEntity<byte[]> downloadContractPdf(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header("Content-Disposition", "inline; filename=contrat-stage-" + id + ".pdf")
                    .body(contratService.genererPdfContrat(id, request));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @RequestMapping(value = "/sign/{contractId}", method = {RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<ContratDTO> signContract(@PathVariable Long contractId,
                                                   @RequestBody(required = false) SignatureConfirmationDTO confirmation,
                                                   HttpServletRequest request) {
        try {
            return ResponseEntity.ok(contratService.signContract(contractId, request,
                    confirmation == null ? null : confirmation.password()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(e.getStatus()).build();
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/eligible-students")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<List<EtudiantEligibleContratDTO>> getEligibleStudents() {
        return ResponseEntity.ok(contratService.getEtudiantsEligibles());
    }
}
