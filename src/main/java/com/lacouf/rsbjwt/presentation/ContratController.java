package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.ContratService;
import com.lacouf.rsbjwt.service.dto.ContratDTO;
import com.lacouf.rsbjwt.service.dto.CreateContratDTO;
import com.lacouf.rsbjwt.service.dto.PreRemplirContratDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/contracts")
public class ContratController {
    private final ContratService contratService;

    @GetMapping("/contracts/prefilled/{studentId}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<PreRemplirContratDTO> preFilledContracts(@PathVariable  Long studentId) throws NotFoundException, BadRequestException {
        return ResponseEntity.ok(contratService.getDonneesPreRemplies(studentId));
    }

    @PostMapping("/contracts")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<ContratDTO> addContract(@RequestBody CreateContratDTO createContratDTO, HttpServletRequest request) throws ConflictException, NotFoundException, BadRequestException {
        ContratDTO saved = contratService.creerContrat(createContratDTO,request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<List<ContratDTO>> getContracts(){
        return ResponseEntity.ok(contratService.listerContrats());
    }

    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<ContratDTO> getContractsById(@PathVariable Long id) throws NotFoundException {
        return ResponseEntity.ok(contratService.getContrat(id));
    }
}
