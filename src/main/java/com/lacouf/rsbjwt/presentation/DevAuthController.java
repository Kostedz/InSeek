package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
@RequestMapping("/user/dev")
@RequiredArgsConstructor
public class DevAuthController {
    private final UtilisateurService utilisateurService;

    @Value("${app.dev.email:dev@inseek.local}")
    private String email;

    @Value("${app.dev.password:DevInSeek!2026}")
    private String password;

    @PostMapping("/login")
    public ResponseEntity<JWTAuthResponse> login() {
        try {
            return ResponseEntity.ok(new JWTAuthResponse(
                    utilisateurService.login(new LoginDTO(email, password))
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (BadRequestException | NotFoundException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
