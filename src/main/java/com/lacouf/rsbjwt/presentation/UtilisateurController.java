package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @PostMapping("/register")
    public ResponseEntity<UtilisateurDTO> registerUser(@RequestBody RegisterDTO registerDTO) {
        try {
            UtilisateurDTO created = utilisateurService.register(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JWTAuthResponse> login(@RequestBody LoginDTO loginDTO){
        try {
            String token = utilisateurService.login(loginDTO);
            JWTAuthResponse jwtAuthResponse = new JWTAuthResponse(token);
            return ResponseEntity.accepted()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jwtAuthResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new JWTAuthResponse());

        }
    }
}
