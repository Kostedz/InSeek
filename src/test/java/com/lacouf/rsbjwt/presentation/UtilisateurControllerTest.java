package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UtilisateurController.class)
class UtilisateurControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean UtilisateurService utilisateurService;

    @Test
    @DisplayName("POST /register avec un étudiant valide retourne 201 et l'EtudiantDTO créé")
    void registerUser_etudiant_retourne201() throws Exception {
        EtudiantDTO dto = new EtudiantDTO(1L, "Tremblay", "Alice", "alice@mail.com",
                "ROLE_ETUDIANT", Disciplines.INFORMATIQUE);
        when(utilisateurService.register(any())).thenReturn(dto);

        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "nom": "Tremblay",
                              "prenom": "Alice",
                              "email": "alice@mail.com",
                              "role": "ETUDIANT",
                              "password": "Abcdef1!",
                              "confirmedPassword": "Abcdef1!",
                              "discipline": "INFORMATIQUE"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Tremblay"))
                .andExpect(jsonPath("$.prenom").value("Alice"));
    }

    @Test
    @DisplayName("POST /register avec un professeur valide retourne 201 et le ProfesseurDTO créé")
    void registerUser_professeur_retourne201() throws Exception {
        ProfesseurDTO dto = new ProfesseurDTO(2L, "Gagnon", "Bob", "bob@mail.com",
                "ROLE_PROFESSEUR", Disciplines.ARCHITECTURE);
        when(utilisateurService.register(any())).thenReturn(dto);

        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "nom": "Gagnon",
                              "prenom": "Bob",
                              "email": "bob@mail.com",
                              "role": "PROFESSEUR",
                              "password": "Abcdef1!",
                              "confirmedPassword": "Abcdef1!",
                              "discipline": "ARCHITECTURE"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Gagnon"))
                .andExpect(jsonPath("$.prenom").value("Bob"));
    }
}
