package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Employeur;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UtilisateurServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UtilisateurService utilisateurService;

    private RegisterDTO validEtudiantDto;
    private RegisterDTO validProfesseurDto;
    private RegisterDTO validEmployeurDto;

    @BeforeEach
    void setUp() {
        validEtudiantDto = new RegisterDTO(
                "Tremblay", "Alice", "alice@mail.com",
                Role.ETUDIANT, "Abcdef1!", "INFORMATIQUE");

        validProfesseurDto = new RegisterDTO(
                "Gagnon", "Bob", "bob@mail.com",
                Role.PROFESSEUR, "Abcdef1!", "INFORMATIQUE");


        validEmployeurDto = new RegisterDTO(
                "Gates", "Will", "will@mail.com",
                Role.EMPLOYEUR, "Abcdef1!", "MicroSoft");
    }

    // TESTER register()

    @Test
    @DisplayName("register() avec un DTO étudiant valide crée le compte et retourne un JWT")
    void register_etudiant_succes_retourneJWT() throws BadRequestException {
        when(utilisateurRepository.findByEmail("alice@mail.com")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(utilisateurRepository.save(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication))
                .thenReturn("fake-jwt-token");

        String result = utilisateurService.register(validEtudiantDto);

        assertNotNull(result);
        assertEquals("fake-jwt-token", result);
        verify(utilisateurRepository).save(any(Etudiant.class));
    }

    @Test
    @DisplayName("register() avec un DTO employeur valide crée le compte et retourne un JWT")
    void register_employeur_succes_retourneJWT() throws BadRequestException {
        when(utilisateurRepository.findByEmail("will@mail.com")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(utilisateurRepository.save(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication))
                .thenReturn("fake-jwt-token");

        String result = utilisateurService.register(validEmployeurDto);

        assertNotNull(result);
        assertEquals("fake-jwt-token", result);
        verify(utilisateurRepository).save(any(Employeur.class));
    }

    @Test
    @DisplayName("getMe() avec un token 'Bearer' valide retourne le DTO de l'étudiant")
    void getMe_avecPrefixeBearer_retourneEtudiantDTO()
            throws BadRequestException {

        Etudiant etudiant = Etudiant.builder()
                .id(1L)
                .nom("Tremblay")
                .prenom("Alice")
                .email("alice@mail.com")
                .password("hashed")
                .discipline(Disciplines.INFORMATIQUE)
                .build();

        when(jwtTokenProvider.getEmailFromJWT("valid-token"))
                .thenReturn("alice@mail.com");
        when(utilisateurRepository.findByEmail("alice@mail.com"))
                .thenReturn(etudiant);

        UtilisateurDTO result =
                utilisateurService.getMe("Bearer valid-token");

        assertNotNull(result);
        assertInstanceOf(EtudiantDTO.class, result);
        assertEquals("Tremblay", result.nom());
    }

    @Test
    @DisplayName("getMe() avec un token 'Bearer' valide retourne le DTO de l'employeur")
    void getMe_avecPrefixeBearer_retourneEmployeurDTO()
            throws BadRequestException {

        Employeur employeur = Employeur.builder()
                .id(1L)
                .nom("Will")
                .prenom("Gates")
                .email("will@mail.com")
                .password("hashed")
                .nomCompagnie("microsoft")
                .build();

        when(jwtTokenProvider.getEmailFromJWT("valid-token"))
                .thenReturn("will@mail.com");
        when(utilisateurRepository.findByEmail("will@mail.com"))
                .thenReturn(employeur);

        UtilisateurDTO result =
                utilisateurService.getMe("Bearer valid-token");

        assertNotNull(result);
        assertInstanceOf(EmployeurDTO.class, result);
        assertEquals("Will", result.nom());
    }

    @Test
    @DisplayName("toDTO() avec un Etudiant retourne un EtudiantDTO")
    void toDTO_etudiant_retourneEtudiantDTO()
            throws BadRequestException {

        Etudiant etudiant = Etudiant.builder()
                .id(1L)
                .nom("Nom")
                .prenom("Prenom")
                .email("a@a.com")
                .password("hashed")
                .discipline(Disciplines.ARCHITECTURE)
                .build();

        UtilisateurDTO dto = utilisateurService.toDTO(etudiant);

        assertInstanceOf(EtudiantDTO.class, dto);
    }

    @Test
    @DisplayName("toDTO() avec un Employeur retourne un EmployeurDTO")
    void toDTO_employeur_retourneEmployeurDTO()
            throws BadRequestException {

        Employeur employeur = Employeur.builder()
                .id(3L)
                .nom("Nom")
                .prenom("Prenom")
                .email("a@a.com")
                .password("hashed")
                .nomCompagnie("Compagnie")
                .build();

        UtilisateurDTO dto = utilisateurService.toDTO(employeur);

        assertInstanceOf(EmployeurDTO.class, dto);
    }

    @Test
    @DisplayName("toEntity() avec un étudiant retourne un Etudiant")
    void toEntity_etudiant_retourneEtudiant()
            throws BadRequestException {

        when(passwordEncoder.encode("Abcdef1!"))
                .thenReturn("hashed");

        Utilisateur result =
                utilisateurService.toEntity(validEtudiantDto);

        assertInstanceOf(Etudiant.class, result);
    }

    @Test
    @DisplayName("toEntity() avec un employeur retourne un Employeur")
    void toEntity_employeur_retourneEmployeur()
            throws BadRequestException {

        when(passwordEncoder.encode("Abcdef1!"))
                .thenReturn("hashed");

        Utilisateur result =
                utilisateurService.toEntity(validEmployeurDto);

        assertInstanceOf(Employeur.class, result);
    }
}