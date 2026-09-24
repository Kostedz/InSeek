package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import com.lacouf.rsbjwt.service.AuthService;
import com.lacouf.rsbjwt.service.UtilisateurService;
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
    PasswordEncoder passwordEncoder;

    // TESTER registerUser()

    @Test
    @DisplayName("POST /user/register avec un étudiant valide retourne 201 et un JWT")
    void registerUser_etudiant_retourne201() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.register(any()))
                .thenReturn("fake-jwt-token");

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "Tremblay",
                                      "prenom": "Alice",
                                      "email": "alice@mail.com",
                                      "role": "ROLE_ETUDIANT",
                                      "password": "Abcdef1!",
                                      "affiliation": "INFORMATIQUE"
                                    }
                                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }

    @Test
    @DisplayName("POST /user/register avec un professeur valide retourne 201 et un JWT")
    void registerUser_professeur_retourne201() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.register(any()))
                .thenReturn("fake-jwt-token");

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "Gagnon",
                                      "prenom": "Bob",
                                      "email": "bob@mail.com",
                                      "role": "ROLE_PROFESSEUR",
                                      "password": "Abcdef1!",
                                      "affiliation": "ARCHITECTURE"
                                    }
                                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }

    @Test
    @DisplayName("POST /user/register avec un employeur valide retourne 201 et un JWT")
    void registerUser_employeur_retourne201() throws Exception {

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
    @DisplayName("POST /user/register avec un courriel invalide retourne 400")
    void registerUser_emailInvalide_retourne400() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);

        when(utilisateurService.register(any()))
                .thenThrow(new BadRequestException(
                        "Le format du courriel est invalide"));

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "Tremblay",
                                      "prenom": "Alice",
                                      "email": "pas-un-email",
                                      "role": "ROLE_ETUDIANT",
                                      "password": "Abcdef1!",
                                      "affiliation": "INFORMATIQUE"
                                    }
                                    """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /user/register avec un courriel déjà existant retourne 400")
    void registerUser_emailDejaExistant_retourne400() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);

        when(utilisateurService.register(any()))
                .thenThrow(new BadRequestException(
                        "Ce courriel est déjà associé à un compte"));

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "Tremblay",
                                      "prenom": "Alice",
                                      "email": "alice@mail.com",
                                      "role": "ROLE_ETUDIANT",
                                      "password": "Abcdef1!",
                                      "affiliation": "INFORMATIQUE"
                                    }
                                    """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /user/register avec un JWT déjà présent retourne 403")
    void registerUser_jwtPresent_retourne403() throws Exception {

        when(authService.validateJwt(any())).thenReturn(true);

        mockMvc.perform(
                        post("/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "nom": "Tremblay",
                                      "prenom": "Alice",
                                      "email": "alice@mail.com",
                                      "role": "ROLE_ETUDIANT",
                                      "password": "Abcdef1!",
                                      "affiliation": "INFORMATIQUE"
                                    }
                                    """))
                .andExpect(status().isForbidden());
    }

    // TESTER login()

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
                                      "email": "alice@mail.com",
                                      "password": "Abcdef1!"
                                    }
                                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }

    @Test
    @DisplayName("POST /user/login avec un JWT déjà présent retourne 403")
    void login_jwtPresent_retourne403() throws Exception {

        when(authService.validateJwt(any())).thenReturn(true);

        mockMvc.perform(
                        post("/user/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "email": "alice@mail.com",
                                      "password": "Abcdef1!"
                                    }
                                    """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /user/login avec des identifiants invalides retourne 401")
    void login_authenticationException_retourne401() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.login(any()))
                .thenThrow(new AuthenticationException(
                        HttpStatus.UNAUTHORIZED,
                        "Identifiants invalides"));

        mockMvc.perform(
                        post("/user/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "email": "alice@mail.com",
                                      "password": "mauvais"
                                    }
                                    """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /user/login avec un utilisateur inexistant retourne 404")
    void login_notFoundException_retourne404() throws Exception {

        when(authService.validateJwt(any())).thenReturn(false);
        when(utilisateurService.login(any()))
                .thenThrow(new NotFoundException("L'utilisateur n'existe pas."));

        mockMvc.perform(
                        post("/user/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "email": "inconnu@mail.com",
                                      "password": "Abcdef1!"
                                    }
                                    """))
                .andExpect(status().isNotFound());
    }

    // TESTER getMe()

    @Test
    @DisplayName("GET /user/me avec un token valide retourne 202 et le DTO de l'utilisateur")
    void getMe_succes_retourne202() throws Exception {

        UtilisateurDTO dto = new EtudiantDTO(
                1L,
                "Tremblay",
                "Alice",
                "alice@mail.com",
                "ROLE_ETUDIANT",
                Disciplines.INFORMATIQUE
        );

        when(utilisateurService.getMe(any())).thenReturn(dto);

        mockMvc.perform(
                        get("/user/me")
                                .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.nom").value("Tremblay"));
    }
}