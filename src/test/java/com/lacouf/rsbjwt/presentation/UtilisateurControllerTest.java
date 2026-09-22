package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.repository.EmprunteurRepository;
import com.lacouf.rsbjwt.repository.GestionnaireRepository;
import com.lacouf.rsbjwt.repository.PreposeRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.EmployeurDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UtilisateurController.class)
class UtilisateurControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    UtilisateurService utilisateurService;

    @MockitoBean
    AuthService authService;

    @MockitoBean
    GestionnaireRepository gestionnaireRepository;

    @MockitoBean
    EmprunteurRepository emprunteurRepository;

    @MockitoBean
    PreposeRepository preposeRepository;

    @MockitoBean
    UserAppRepository userAppRepository;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    // TESTER registerUser()

    @Test
    @DisplayName("POST /user/register avec un employeur valide retourne 201 et un JWT")
    void registerUser_etudiant_retourne201() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.register(any()))
                .thenReturn("fake-jwt-token");

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "From",
                                      "prenom": "Soft",
                                      "email": "fromsoft@mail.com",
                                      "role": "ROLE_EMPLOYEUR",
                                      "password": "Abcdef1!",
                                      "affiliation": "FromSoft"
                                    }
                                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }


    @Test
    @DisplayName("POST /user/login avec des identifiants valides retourne 200 et un JWT")
    void login_succes_retourne200() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.login(any())).thenReturn("fake-jwt-token");

        mockMvc.perform(
                        post("/user/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "email": "fromsoft@mail.com",
                                      "password": "Abcdef1!"
                                    }
                                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }

    @Test
    @DisplayName("GET /user/me avec un token valide retourne 202 et le DTO de l'utilisateur")
    void getMe_succes_retourne202() throws Exception {

        UtilisateurDTO dto = new EmployeurDTO(
                1L,
                "From",
                "Soft",
                "fromsoft@mail.com",
                "ROLE_EMPLOYEUR",
                "fromsoft"
        );

        when(utilisateurService.getMe(any())).thenReturn(dto);

        mockMvc.perform(
                        get("/user/me")
                                .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.nom").value("From"));
    }
}