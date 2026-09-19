package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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

    @InjectMocks
    private UtilisateurService utilisateurService;

    private RegisterDTO validEtudiantDto;
    private RegisterDTO validProfesseurDto;

    @BeforeEach
    void setUp() {
        validEtudiantDto = new RegisterDTO(
                "Tremblay", "Alice", "alice@mail.com", Role.ETUDIANT,
                "Abcdef1!", "Abcdef1!", Disciplines.INFORMATIQUE);

        validProfesseurDto = new RegisterDTO(
                "Gagnon", "Bob", "bob@mail.com", Role.PROFESSEUR,
                "Abcdef1!", "Abcdef1!", Disciplines.INFORMATIQUE);
    }

    //TESTER register()

    @Test
    @DisplayName("register() avec un DTO étudiant valide crée le compte et retourne un EtudiantDTO")
    void register_etudiant_succes_retourneDTO() throws BadRequestException {
        when(utilisateurRepository.findByEmail("alice@mail.com")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(utilisateurRepository.save(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UtilisateurDTO result = utilisateurService.register(validEtudiantDto);

        assertNotNull(result);
        assertTrue(result instanceof EtudiantDTO);
        assertEquals("Tremblay", result.nom());
        assertEquals("Alice", result.prenom());
        verify(utilisateurRepository).save(any(Etudiant.class));
    }

    @Test
    @DisplayName("register() avec un DTO professeur valide crée le compte et retourne un ProfesseurDTO")
    void register_professeur_succes_retourneDTO() throws BadRequestException {
        when(utilisateurRepository.findByEmail("bob@mail.com")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(utilisateurRepository.save(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UtilisateurDTO result = utilisateurService.register(validProfesseurDto);

        assertNotNull(result);
        assertTrue(result instanceof ProfesseurDTO);
        assertEquals("Gagnon", result.nom());
        assertEquals("Bob", result.prenom());
        verify(utilisateurRepository).save(any(Professeur.class));
    }

    @Test
    @DisplayName("register() avec un prénom vide lève une BadRequestException")
    void register_prenomVide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("Nom", "", "a@a.com", Role.ETUDIANT,
                "Abcdef1!", "Abcdef1!", Disciplines.INFORMATIQUE);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Le prénom est obligatoire", exception.getMessage());
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("register() avec un nom vide lève une BadRequestException")
    void register_nomVide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("", "Prenom", "a@a.com", Role.ETUDIANT,
                "Abcdef1!", "Abcdef1!", Disciplines.INFORMATIQUE);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Le nom est obligatoire", exception.getMessage());
    }

    @Test
    @DisplayName("register() avec un courriel au format invalide lève une BadRequestException")
    void register_emailInvalide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "pas-un-email", Role.ETUDIANT,
                "Abcdef1!", "Abcdef1!", Disciplines.INFORMATIQUE);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Le format du courriel est invalide", exception.getMessage());
    }

    @Test
    @DisplayName("register() avec un mot de passe trop faible lève une BadRequestException")
    void register_motDePasseFaible_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "a@a.com", Role.ETUDIANT,
                "faible", "faible", Disciplines.INFORMATIQUE);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertTrue(exception.getMessage().contains("mot de passe"));
    }

    @Test
    @DisplayName("register() avec des mots de passe différents lève une BadRequestException")
    void register_motsDePasseDifferents_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "a@a.com", Role.ETUDIANT,
                "Abcdef1!", "Autrechose1!", Disciplines.INFORMATIQUE);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Les mots de passe ne correspondent pas", exception.getMessage());
    }

    @Test
    @DisplayName("register() avec un courriel déjà utilisé lève une BadRequestException")
    void register_emailDejaExistant_leveBadRequestException() {
        when(utilisateurRepository.findByEmail("alice@mail.com"))
                .thenReturn(mock(Etudiant.class));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.register(validEtudiantDto));

        assertEquals("Ce courriel est déjà associé à un compte", exception.getMessage());
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrationVerification() avec un DTO null lève une BadRequestException")
    void register_dtoNull_leveBadRequestException() {
        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.registrationVerification(null));

        assertEquals("Le DTO d'inscription est null.", exception.getMessage());
    }

    // TESTER findByEmail()

    @Test
    @DisplayName("findByEmail() avec un courriel existant retourne le DTO correspondant")
    void findByEmail_succes_retourneDTO() throws BadRequestException {
        Etudiant etudiant = Etudiant.builder()
                .id(1L).nom("Tremblay").prenom("Alice")
                .email("alice@mail.com").password("hashed")
                .discipline(Disciplines.INFORMATIQUE).build();

        when(utilisateurRepository.findByEmail("alice@mail.com")).thenReturn(etudiant);

        UtilisateurDTO result = utilisateurService.findByEmail("alice@mail.com");

        assertNotNull(result);
        assertEquals("Tremblay", result.nom());
    }

    @Test
    @DisplayName("findByEmail() avec un email null lève une BadRequestException")
    void findByEmail_emailNull_leveBadRequestException() {
        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.findByEmail(null));

        assertEquals("L'email ne peut pas être null ou vide.", exception.getMessage());
    }

    @Test
    @DisplayName("findByEmail() avec un email vide lève une BadRequestException")
    void findByEmail_emailVide_leveBadRequestException() {
        assertThrows(BadRequestException.class,
                () -> utilisateurService.findByEmail("  "));
    }

    //  toDTO()

    @Test
    @DisplayName("toDTO() avec un utilisateur null retourne null")
    void toDTO_null_retourneNull() throws BadRequestException {
        assertNull(utilisateurService.toDTO(null));
    }

    @Test
    @DisplayName("toDTO() avec un Etudiant retourne un EtudiantDTO")
    void toDTO_etudiant_retourneEtudiantDTO() throws BadRequestException {
        Etudiant etudiant = Etudiant.builder()
                .id(1L).nom("Nom").prenom("Prenom")
                .email("a@a.com").password("hashed")
                .discipline(Disciplines.ARCHITECTURE).build();

        UtilisateurDTO dto = utilisateurService.toDTO(etudiant);

        assertTrue(dto instanceof EtudiantDTO);
    }

    @Test
    @DisplayName("toDTO() avec un Professeur retourne un ProfesseurDTO")
    void toDTO_professeur_retourneProfesseurDTO() throws BadRequestException {
        Professeur professeur = Professeur.builder()
                .id(1L).nom("Nom").prenom("Prenom")
                .email("a@a.com").password("hashed")
                .discipline(Disciplines.ARCHITECTURE).build();

        UtilisateurDTO dto = utilisateurService.toDTO(professeur);

        assertTrue(dto instanceof ProfesseurDTO);
    }

    // toEntity()

    @Test
    @DisplayName("toEntity() avec un RegisterDTO null retourne null")
    void toEntity_null_retourneNull() throws BadRequestException {
        assertNull(utilisateurService.toEntity(null));
    }

    @Test
    @DisplayName("toEntity() avec un rôle non supporté exemple: GESTIONNAIRE ca lève une BadRequestException")
    void toEntity_roleNonSupporte_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "a@a.com", Role.GESTIONNAIRE,
                "Abcdef1!", "Abcdef1!", null);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> utilisateurService.toEntity(dto));

        assertEquals("Type de DTO non pris en charge pour la conversion en entité.", exception.getMessage());
    }
}