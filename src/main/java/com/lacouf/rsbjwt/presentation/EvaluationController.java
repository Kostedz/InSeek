package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.EvaluationService;
import com.lacouf.rsbjwt.service.dto.CompanyEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.PrefillCompanyEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.PrefillStudentEvaluationDTO;
import com.lacouf.rsbjwt.service.dto.StudentEvaluationDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/evaluations")
@RequiredArgsConstructor
public class EvaluationController {
    private final EvaluationService evaluationService;
    private final JwtTokenProvider jwtTokenProvider;
    private String getEmailFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtTokenProvider.getEmailFromJWT(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping("/milieu/prefill/{studentId}")
    public ResponseEntity<?> getPreFillCompanyEvaluation(@PathVariable Long studentId, HttpServletRequest request) {
        try {
            String email = getEmailFromRequest(request);
            PrefillCompanyEvaluationDTO prefillDTO = evaluationService.getPreFillCompanyEvaluation(email, studentId);
            return ResponseEntity.ok(prefillDTO);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/milieu")
    public ResponseEntity<?> submitCompanyEvaluation(@RequestBody CompanyEvaluationDTO dto, HttpServletRequest request) {
        try {
            String email = getEmailFromRequest(request);
            CompanyEvaluationDTO result = (CompanyEvaluationDTO) evaluationService.submitEvaluation(dto, email);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/milieu/{studentId}")
    public ResponseEntity<?> getSubmittedCompanyEvaluation(@PathVariable Long studentId, HttpServletRequest request) {
        try {
            String email = getEmailFromRequest(request);
            CompanyEvaluationDTO evaluation = evaluationService.getSubmittedCompanyEvaluation(email, studentId);
            return ResponseEntity.ok(evaluation);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/etudiant/prefill/{studentId}")
    public ResponseEntity<?> getPreFillStudentEvaluation(
            @PathVariable Long studentId,
            HttpServletRequest request) {

        try {
            String email = getEmailFromRequest(request);

            PrefillStudentEvaluationDTO prefill =
                    evaluationService.getPrefillStudentEvaluation(email, studentId);

            return ResponseEntity.ok(prefill);

        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/etudiant")
    public ResponseEntity<?> submitStudentEvaluation(
            @RequestBody StudentEvaluationDTO dto,
            HttpServletRequest request) {

        try {
            String email = getEmailFromRequest(request);

            StudentEvaluationDTO result =
                    (StudentEvaluationDTO) evaluationService.submitEvaluation(dto, email);

            return ResponseEntity.status(HttpStatus.CREATED).body(result);

        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/etudiant/{studentId}")
    public ResponseEntity<?> getSubmittedStudentEvaluation(
            @PathVariable Long studentId,
            HttpServletRequest request) {

        try {
            String email = getEmailFromRequest(request);

            StudentEvaluationDTO evaluation =
                    evaluationService.getSubmittedStudentEvaluation(email, studentId);

            return ResponseEntity.ok(evaluation);

        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
