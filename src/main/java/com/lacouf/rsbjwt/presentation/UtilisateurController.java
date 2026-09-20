package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
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

import java.util.logging.Logger;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private static final Logger logger = Logger.getLogger(UtilisateurController.class.getName());
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<JWTAuthResponse> registerUser(@RequestBody RegisterDTO registerDTO, HttpServletRequest request) {
        try {
            logger.info("Registering user: " + registerDTO);
            if (authService.validateJwt(request)) {
                logger.warning("Attempted registration with invalid JWT: " + registerDTO + " - " + request.getHeader("Authorization"));
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            String token = utilisateurService.register(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(new JWTAuthResponse(token));
        } catch (BadRequestException e) {
            logger.severe("Error occurred while registering user: " + registerDTO);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JWTAuthResponse> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request){
        try {
            logger.info("Logging in user: " + loginDTO.getEmail());
            if (authService.validateJwt(request)) {
                logger.warning("Attempted login with invalid JWT: " + loginDTO.getEmail() + " - " + request.getHeader("Authorization"));
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            String token = utilisateurService.login(loginDTO);
            return ResponseEntity.ok(new JWTAuthResponse(token));
        } catch (AuthenticationException e) {
            logger.severe("Authentication failed for user: " + loginDTO.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        } catch (BadRequestException e) {
            logger.severe("Error occurred while logging in user: " + loginDTO.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (NotFoundException e) {
            logger.severe("User not found: " + loginDTO.getEmail());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }


    @GetMapping("/me")
	public ResponseEntity<UtilisateurDTO> getMe(HttpServletRequest request) throws BadRequestException {
		return ResponseEntity.accepted().contentType(MediaType.APPLICATION_JSON).body(
			utilisateurService.getMe(request.getHeader("Authorization")));
	}
}
