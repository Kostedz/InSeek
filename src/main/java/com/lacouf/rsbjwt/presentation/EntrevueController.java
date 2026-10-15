package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.EntrevueService;
import com.lacouf.rsbjwt.service.dto.CreateEntrevueDTO;
import com.lacouf.rsbjwt.service.dto.EntrevueDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
public class EntrevueController {

    private final EntrevueService interviewService;
    private final AuthService authService;


    // P: Pourquoi préciser le employerId dans l'URI? On peux fetch les infos du employer à partir du token JWT.
    @PostMapping("/schedule/{employerId}")
    public ResponseEntity<?> scheduleInterview(@PathVariable Long employerId, @RequestBody CreateEntrevueDTO InterviewDTO, HttpServletRequest request) {
        try{
            if (!authService.validateJwt(request)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("token invalide");
            }
            EntrevueDTO savedInterview = interviewService.scheduleInterview(employerId, InterviewDTO);
            return ResponseEntity.ok(savedInterview);
        } catch(BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }


    }

}
