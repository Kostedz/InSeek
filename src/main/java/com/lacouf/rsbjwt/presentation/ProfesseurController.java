package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.ProfesseurDto;
import com.lacouf.rsbjwt.service.dto.ProfesseurRegisterDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/professeur")
@RequiredArgsConstructor
public class ProfesseurController {

    private final UserAppService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody ProfesseurRegisterDTO dto) {
        try {
            ProfesseurDto professeur = userService.registerProfesseur(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(professeur);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}

