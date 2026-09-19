package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<JWTAuthResponse> registerUser(@RequestBody RegisterDTO registerDTO) {
        try {
            String token = utilisateurService.register(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(new JWTAuthResponse(token));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JWTAuthResponse> login(@RequestBody LoginDTO loginDTO){
        try {
            String token = authService.login(loginDTO);
            return ResponseEntity.ok(new JWTAuthResponse(token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        }
    }

    @GetMapping("/me")
	public ResponseEntity<UtilisateurDTO> getMe(HttpServletRequest request) throws BadRequestException {
		return ResponseEntity.accepted().contentType(MediaType.APPLICATION_JSON).body(
			authService.getMe(request.getHeader("Authorization")));
	}
}
