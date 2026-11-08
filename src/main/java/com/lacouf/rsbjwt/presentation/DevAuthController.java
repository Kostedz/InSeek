package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.config.DevDemoAccounts;
import com.lacouf.rsbjwt.config.DevDemoScenarioService;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
@RequestMapping("/user/demo")
@RequiredArgsConstructor
public class DevAuthController {
    private final UtilisateurService utilisateurService;
    private final DevDemoScenarioService demoScenarioService;

    @PostMapping("/login")
    public ResponseEntity<JWTAuthResponse> demoLogin(@RequestParam String role) {
        try {
            Role demoRole = Role.valueOf(role.replaceFirst("^ROLE_", "").toUpperCase());
            DevDemoAccounts.Account demoAccount = DevDemoAccounts.forRole(demoRole);
            if (demoAccount == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(new JWTAuthResponse(
                    utilisateurService.login(new LoginDTO(demoAccount.email(), demoAccount.password()))
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (BadRequestException | NotFoundException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/student-demo")
    public ResponseEntity<JWTAuthResponse> prepareStudentDemo() {
        try {
            demoScenarioService.prepareStudentScenario();
            DevDemoAccounts.Account student = DevDemoAccounts.forRole(Role.ETUDIANT);
            return ResponseEntity.ok(new JWTAuthResponse(
                    utilisateurService.login(new LoginDTO(student.email(), student.password()))
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (BadRequestException | NotFoundException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/student-contract-demo")
    public ResponseEntity<JWTAuthResponse> prepareSignedContractStudentDemo() {
        try {
            demoScenarioService.prepareSignedContractStudentScenario();
            DevDemoAccounts.Account student = DevDemoAccounts.signedContractStudent();
            return ResponseEntity.ok(new JWTAuthResponse(
                    utilisateurService.login(new LoginDTO(student.email(), student.password()))
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (BadRequestException | NotFoundException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/delayed-notifications-demo")
    public ResponseEntity<JWTAuthResponse> prepareDelayedNotificationsDemo() {
        try {
            demoScenarioService.prepareDelayedNotificationsScenario();
            DevDemoAccounts.Account manager = DevDemoAccounts.forRole(Role.GESTIONNAIRE);
            return ResponseEntity.ok(new JWTAuthResponse(
                    utilisateurService.login(new LoginDTO(manager.email(), manager.password()))
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (BadRequestException | NotFoundException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
