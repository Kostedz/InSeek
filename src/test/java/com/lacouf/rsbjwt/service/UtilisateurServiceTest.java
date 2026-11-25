package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.utilisateur.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.*;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.auth.LoginDTO;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.auth.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
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
    @DisplayName("register() avec un DTO professeur valide crée le compte et retourne un JWT")
    void register_professeur_succes_retourneJWT() throws BadRequestException {
        when(utilisateurRepository.findByEmail("bob@mail.com")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(utilisateurRepository.save(any(Utilisateur.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication))
                .thenReturn("fake-jwt-token");

        String result = utilisateurService.register(validProfesseurDto);

        assertNotNull(result);
        assertEquals("fake-jwt-token", result);
        verify(utilisateurRepository).save(any(Professeur.class));
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
    @DisplayName("register() avec un prénom vide donc une BadRequestException")
    void register_prenomVide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", "", "a@a.com", Role.ETUDIANT,
                "Abcdef1!", "INFORMATIQUE");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Le prénom est obligatoire", exception.getMessage());
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("register() avec un nom vide lève une BadRequestException")
    void register_nomVide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO(
                "", "Prenom", "a@a.com", Role.ETUDIANT,
                "Abcdef1!", "INFORMATIQUE");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals("Le nom est obligatoire", exception.getMessage());
    }

    @Test
    @DisplayName("register() avec un courriel au format invalide lève une BadRequestException")
    void register_emailInvalide_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", "Prenom", "pas-un-email", Role.ETUDIANT,
                "Abcdef1!", "INFORMATIQUE");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertEquals(
                "Le format du courriel est invalide",
                exception.getMessage());
    }

    @Test
    @DisplayName("register() avec un mot de passe trop faible lève une BadRequestException")
    void register_motDePasseFaible_leveBadRequestException() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", "Prenom", "a@a.com", Role.ETUDIANT,
                "faible", "INFORMATIQUE");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(dto));

        assertTrue(exception.getMessage().contains("mot de passe"));
    }

    @Test
    @DisplayName("register() avec un courriel déjà utilisé lève une BadRequestException")
    void register_emailDejaExistant_leveBadRequestException() {
        when(utilisateurRepository.findByEmail("alice@mail.com"))
                .thenReturn(mock(Etudiant.class));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(validEtudiantDto));

        assertEquals(
                "Ce courriel est déjà associé à un compte",
                exception.getMessage());

        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrationVerification() avec un DTO null lève une BadRequestException")
    void register_dtoNull_leveBadRequestException() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.register(null));

        assertEquals(
                "Le DTO d'inscription est null.",
                exception.getMessage());
    }


    @Test
    @DisplayName("registrationVerification() avec un DTO valide retourne true")
    void registrationVerification_valide_retourneTrue()
            throws BadRequestException {

        when(utilisateurRepository.findByEmail("alice@mail.com"))
                .thenReturn(null);

        assertTrue(
                utilisateurService.registrationVerification(validEtudiantDto));
    }

    @Test
    @DisplayName("login() avec des identifiants valides retourne un JWT")
    void login_succes_retourneJWT()
            throws BadRequestException, NotFoundException {

        LoginDTO loginDTO = new LoginDTO(
                "alice@mail.com",
                "Abcdef1!");

        when(utilisateurRepository.findByEmail("alice@mail.com"))
                .thenReturn(mock(Etudiant.class));
        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication))
                .thenReturn("fake-jwt-token");

        String result = utilisateurService.login(loginDTO);

        assertNotNull(result);
        assertEquals("fake-jwt-token", result);
    }

    @Test
    @DisplayName("login() avec un DTO null lève une BadRequestException")
    void login_dtoNull_leveBadRequestException() {

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> utilisateurService.login(null));

        assertEquals(
                "Le DTO de connexion est null.",
                exception.getMessage());
    }

    @Test
    @DisplayName("login() avec un email inexistant lève une NotFoundException")
    void login_emailInexistant_leveNotFoundException() {

        LoginDTO loginDTO = new LoginDTO(
                "inconnu@mail.com",
                "Abcdef1!");

        when(utilisateurRepository.findByEmail("inconnu@mail.com"))
                .thenReturn(null);

        NotFoundException exception = assertThrows(
                NotFoundException.class,
                () -> utilisateurService.login(loginDTO));

        assertEquals(
                "L'utilisateur n'existe pas.",
                exception.getMessage());
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
    @DisplayName("getMe() sans préfixe 'Bearer' retourne le DTO du professeur")
    void getMe_sansPrefixeBearer_retourneProfesseurDTO()
            throws BadRequestException {

        Professeur professeur = Professeur.builder()
                .id(2L)
                .nom("Gagnon")
                .prenom("Bob")
                .email("bob@mail.com")
                .password("hashed")
                .discipline(Disciplines.ARCHITECTURE)
                .build();

        when(jwtTokenProvider.getEmailFromJWT("valid-token"))
                .thenReturn("bob@mail.com");
        when(utilisateurRepository.findByEmail("bob@mail.com"))
                .thenReturn(professeur);

        UtilisateurDTO result =
                utilisateurService.getMe("valid-token");

        assertNotNull(result);
        assertInstanceOf(ProfesseurDTO.class, result);
        assertEquals("Gagnon", result.nom());
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
    @DisplayName("toDTO() avec un utilisateur null retourne null")
    void toDTO_null_retourneNull() throws BadRequestException {
        assertNull(utilisateurService.toDTO(null));
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
    @DisplayName("toDTO() avec un Professeur retourne un ProfesseurDTO")
    void toDTO_professeur_retourneProfesseurDTO()
            throws BadRequestException {

        Professeur professeur = Professeur.builder()
                .id(1L)
                .nom("Nom")
                .prenom("Prenom")
                .email("a@a.com")
                .password("hashed")
                .discipline(Disciplines.ARCHITECTURE)
                .build();

        UtilisateurDTO dto = utilisateurService.toDTO(professeur);

        assertInstanceOf(ProfesseurDTO.class, dto);
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
    @DisplayName("toEntity() avec un RegisterDTO null retourne null")
    void toEntity_RegisterDTO_null_retourneNull() throws BadRequestException {
        assertNull(utilisateurService.toEntity((RegisterDTO) null));
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
    @DisplayName("toEntity() avec un professeur retourne un Professeur")
    void toEntity_professeur_retourneProfesseur()
            throws BadRequestException {

        when(passwordEncoder.encode("Abcdef1!"))
                .thenReturn("hashed");

        Utilisateur result =
                utilisateurService.toEntity(validProfesseurDto);

        assertInstanceOf(Professeur.class, result);
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

    @Test
    @DisplayName("registrationVerification() avec un prénom null lève une BadRequestException")
    void registrationVerification_prenomNull_leveBadRequest() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", null, "a@a.com", Role.ETUDIANT, "Abcdef1!", "INFORMATIQUE");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.registrationVerification(dto));

        assertEquals("Le prénom est obligatoire", ex.getMessage());
    }

    @Test
    @DisplayName("registrationVerification() avec un nom null lève une BadRequestException")
    void registrationVerification_nomNull_leveBadRequest() {
        RegisterDTO dto = new RegisterDTO(
                null, "Prenom", "a@a.com", Role.ETUDIANT, "Abcdef1!", "INFORMATIQUE");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.registrationVerification(dto));

        assertEquals("Le nom est obligatoire", ex.getMessage());
    }

    @Test
    @DisplayName("registrationVerification() avec un courriel null lève une BadRequestException")
    void registrationVerification_emailNull_leveBadRequest() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", "Prenom", null, Role.ETUDIANT, "Abcdef1!", "INFORMATIQUE");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.registrationVerification(dto));

        assertEquals("Le format du courriel est invalide", ex.getMessage());
    }

    @Test
    @DisplayName("registrationVerification() avec un mot de passe null lève une BadRequestException")
    void registrationVerification_motDePasseNull_leveBadRequest() {
        RegisterDTO dto = new RegisterDTO(
                "Nom", "Prenom", "a@a.com", Role.ETUDIANT, null, "INFORMATIQUE");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.registrationVerification(dto));

        assertTrue(ex.getMessage().contains("mot de passe"));
    }

    @Test
    @DisplayName("updateMyDiscipline() avec un DTO null lève une BadRequestException")
    void updateMyDiscipline_dtoNull_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.updateMyDiscipline("Bearer valid-token", null));

        assertEquals("La discipline est obligatoire.", ex.getMessage());
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    @DisplayName("updateMyDiscipline() avec une discipline null lève une BadRequestException")
    void updateMyDiscipline_disciplineNull_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.updateMyDiscipline("Bearer valid-token", new DisciplineUpdateDTO(null)));

        assertEquals("La discipline est obligatoire.", ex.getMessage());
    }

    @Test
    @DisplayName("updateMyDiscipline() sans en-tête Authorization lève une BadRequestException")
    void updateMyDiscipline_authorizationNull_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.updateMyDiscipline(null, new DisciplineUpdateDTO(Disciplines.ARCHITECTURE)));

        assertEquals("Token JWT invalide.", ex.getMessage());
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    @DisplayName("updateMyDiscipline() sans préfixe Bearer lève une BadRequestException")
    void updateMyDiscipline_sansBearer_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.updateMyDiscipline("valid-token", new DisciplineUpdateDTO(Disciplines.ARCHITECTURE)));

        assertEquals("Token JWT invalide.", ex.getMessage());
    }

    @Test
    @DisplayName("updateMyDiscipline() avec un utilisateur inexistant lève une NotFoundException")
    void updateMyDiscipline_utilisateurInexistant_leveNotFound() {
        when(jwtTokenProvider.getEmailFromJWT("valid-token")).thenReturn("inconnu@mail.com");
        when(utilisateurRepository.findByEmail("inconnu@mail.com")).thenReturn(null);

        assertThrows(NotFoundException.class,
                () -> utilisateurService.updateMyDiscipline("Bearer valid-token", new DisciplineUpdateDTO(Disciplines.ARCHITECTURE)));

        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateMyDiscipline() par un non-étudiant lève une BadRequestException")
    void updateMyDiscipline_pasEtudiant_leveBadRequest() {
        when(jwtTokenProvider.getEmailFromJWT("valid-token")).thenReturn("bob@mail.com");
        when(utilisateurRepository.findByEmail("bob@mail.com")).thenReturn(mock(Professeur.class));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.updateMyDiscipline("Bearer valid-token", new DisciplineUpdateDTO(Disciplines.ARCHITECTURE)));

        assertEquals("Seul un étudiant peut modifier sa discipline.", ex.getMessage());
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateMyDiscipline() par un étudiant met à jour la discipline")
    void updateMyDiscipline_succes_modifieDiscipline() throws Exception {
        Etudiant etudiant = Etudiant.builder()
                .id(1L).nom("Tremblay").prenom("Alice").email("alice@mail.com")
                .password("hashed").discipline(Disciplines.INFORMATIQUE).build();
        when(jwtTokenProvider.getEmailFromJWT("valid-token")).thenReturn("alice@mail.com");
        when(utilisateurRepository.findByEmail("alice@mail.com")).thenReturn(etudiant);
        when(utilisateurRepository.save(etudiant)).thenReturn(etudiant);

        UtilisateurDTO result = utilisateurService.updateMyDiscipline(
                "Bearer valid-token", new DisciplineUpdateDTO(Disciplines.ARCHITECTURE));

        assertInstanceOf(EtudiantDTO.class, result);
        assertEquals(Disciplines.ARCHITECTURE, etudiant.getDiscipline());
        verify(utilisateurRepository).save(etudiant);
    }

    @Test
    @DisplayName("findByEmail() avec un email null lève une BadRequestException")
    void findByEmail_emailNull_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.findByEmail(null));

        assertEquals("L'email est obligatoire", ex.getMessage());
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    @DisplayName("findByEmail() avec un email vide lève une BadRequestException")
    void findByEmail_emailVide_leveBadRequest() {
        assertThrows(BadRequestException.class, () -> utilisateurService.findByEmail("   "));
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    @DisplayName("findByEmail() avec un email inexistant lève une NotFoundException")
    void findByEmail_inexistant_leveNotFound() {
        when(utilisateurRepository.findByEmail("inconnu@mail.com")).thenReturn(null);

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> utilisateurService.findByEmail("inconnu@mail.com"));

        assertEquals("L'utilisateur n'existe pas.", ex.getMessage());
    }

    @Test
    @DisplayName("findByEmail() avec un email existant retourne le DTO")
    void findByEmail_succes_retourneDTO() throws Exception {
        Professeur professeur = Professeur.builder()
                .id(2L).nom("Gagnon").prenom("Bob").email("bob@mail.com")
                .password("hashed").discipline(Disciplines.ARCHITECTURE).build();
        when(utilisateurRepository.findByEmail("bob@mail.com")).thenReturn(professeur);

        UtilisateurDTO result = utilisateurService.findByEmail("bob@mail.com");

        assertInstanceOf(ProfesseurDTO.class, result);
        assertEquals("Gagnon", result.nom());
    }

    @Test
    @DisplayName("findEntityByEmail() avec un utilisateur existant retourne l'entité")
    void findEntityByEmail_succes_retourneEntite() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        when(utilisateurRepository.findByEmail("alice@mail.com")).thenReturn(etudiant);

        assertSame(etudiant, utilisateurService.findEntityByEmail("alice@mail.com"));
    }

    @Test
    @DisplayName("findEntityByEmail() avec un utilisateur inexistant lève une NotFoundException")
    void findEntityByEmail_inexistant_leveNotFound() {
        when(utilisateurRepository.findByEmail("inconnu@mail.com")).thenReturn(null);

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> utilisateurService.findEntityByEmail("inconnu@mail.com"));

        assertEquals("Utilisateur not found", ex.getMessage());
    }

    @Test
    @DisplayName("toDTO() avec un Gestionnaire retourne un GestionnaireDTO")
    void toDTO_gestionnaire_retourneGestionnaireDTO() throws BadRequestException {
        Gestionnaire gestionnaire = new Gestionnaire(null, "Nom", "Prenom", "g@a.com", "hashed");

        UtilisateurDTO dto = utilisateurService.toDTO(gestionnaire);

        assertInstanceOf(GestionnaireDTO.class, dto);
    }

    @Test
    @DisplayName("toDTO() avec un type d'utilisateur non supporté lève une BadRequestException")
    void toDTO_typeNonSupporte_leveBadRequest() {
        Utilisateur inconnu = mock(Utilisateur.class);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.toDTO(inconnu));

        assertEquals("Type d'entité non pris en charge pour la conversion en DTO.", ex.getMessage());
    }

    @Test
    @DisplayName("toEntity() avec un gestionnaire retourne un Gestionnaire")
    void toEntity_gestionnaire_retourneGestionnaire() throws BadRequestException {
        when(passwordEncoder.encode("Abcdef1!")).thenReturn("hashed");
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "g@a.com", Role.GESTIONNAIRE, "Abcdef1!", null);

        Utilisateur result = utilisateurService.toEntity(dto);

        assertInstanceOf(Gestionnaire.class, result);
        verify(passwordEncoder).encode("Abcdef1!");
    }

    @Test
    @DisplayName("toEntity() avec un rôle non supporté lève une BadRequestException")
    void toEntity_roleNonSupporte_leveBadRequest() {
        RegisterDTO dto = new RegisterDTO("Nom", "Prenom", "a@a.com", null, "Abcdef1!", "INFORMATIQUE");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> utilisateurService.toEntity(dto));

        assertEquals("Type de DTO non pris en charge pour la conversion en entité.", ex.getMessage());
    }

    @Test
    @DisplayName("getGestionnaire() retourne le gestionnaire existant")
    void getGestionnaire_succes_retourneGestionnaire() throws NotFoundException {
        Gestionnaire gestionnaire = mock(Gestionnaire.class);
        when(utilisateurRepository.findGestionnaire()).thenReturn(gestionnaire);

        assertSame(gestionnaire, utilisateurService.getGestionnaire());
    }

    @Test
    @DisplayName("getGestionnaire() sans gestionnaire lève une NotFoundException")
    void getGestionnaire_aucun_leveNotFound() {
        when(utilisateurRepository.findGestionnaire()).thenReturn(null);

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> utilisateurService.getGestionnaire());

        assertEquals("Aucun gestionnaire trouvé.", ex.getMessage());
    }

    @Test
    @DisplayName("existsByEmail() retourne true quand le courriel existe")
    void existsByEmail_existant_retourneTrue() {
        when(utilisateurRepository.existsByCredentials_Email("alice@mail.com")).thenReturn(true);

        assertTrue(utilisateurService.existsByEmail("alice@mail.com"));
    }

    @Test
    @DisplayName("existsByEmail() retourne false quand le courriel n'existe pas")
    void existsByEmail_inexistant_retourneFalse() {
        when(utilisateurRepository.existsByCredentials_Email("inconnu@mail.com")).thenReturn(false);

        assertFalse(utilisateurService.existsByEmail("inconnu@mail.com"));
    }
}