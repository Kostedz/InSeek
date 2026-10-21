package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.EntrevueService;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import com.lacouf.rsbjwt.service.dto.RepondreConvocationDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
public class EntrevueController {

    private final EntrevueService interviewService;


    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleInterview(@RequestBody CreateEntrevueDTO InterviewDTO, HttpServletRequest request) {
        try{
            EntrevueDTO savedInterview = interviewService.scheduleInterview(request, InterviewDTO);
            return ResponseEntity.ok(savedInterview);
        } catch(BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/student")
    public ResponseEntity<?> getMyInterviews(HttpServletRequest request) {
        try{
            List<EntrevueDTO> interviews = interviewService.getInterviewsForStudent(request);
            return ResponseEntity.ok(interviews);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInterviewDetails(@PathVariable Long interviewId, HttpServletRequest request) {
        try {
            EntrevueDTO dto = interviewService.getInterviewDetails(interviewId, request);
            return ResponseEntity.ok(dto);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{interviewId}/respond")
    public ResponseEntity<?> respondToInterview( @PathVariable Long interviewId, @RequestBody RepondreConvocationDTO responseDTO, HttpServletRequest request) {
        try {
            EntrevueDTO updated = interviewService.respondToInterviewInvitation(interviewId, responseDTO, request);
            return ResponseEntity.ok(updated);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    @PutMapping("/update")
    public ResponseEntity<?> updateInterview(@RequestBody CreateEntrevueDTO InterviewDTO, HttpServletRequest request) {
        try {
            EntrevueDTO updatedInterview = interviewService.updateInterview(request, InterviewDTO);
            return ResponseEntity.ok(updatedInterview);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

}
