package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.*;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserAppService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserAppRepository userAppRepository;
    private final EmprunteurRepository emprunteurRepository;
    private final PreposeRepository preposeRepository;
    private final GestionnaireRepository gestionnaireRepository;
    private final ProfesseurRepository professeurRepository;
    private final PasswordEncoder passwordEncoder;

    public String authenticateUser(LoginDTO loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword()));
        final String token = jwtTokenProvider.generateToken(authentication);
        System.out.println("JWT Token " + token);
        return token;
    }

    public UserDTO getMe(String token) {
        token = token.startsWith("Bearer") ? token.substring(7) : token;
        String email = jwtTokenProvider.getEmailFromJWT(token);
        UserApp user = userAppRepository.findUserAppByEmail(email).orElseThrow(UserNotFoundException::new);
        return switch(user.getRole()){
            case EMPRUNTEUR -> getEmprunteurDto(user.getId());
            case PREPOSE -> getPreposeDto(user.getId());
            case GESTIONNAIRE -> getGestionnaireDto(user.getId());
            case PROFESSEUR -> getProfesseurDto(user.getId());
            case ETUDIANT -> getEtudiantDto(user.getId());
        };
    }

    private UserDTO getEtudiantDto(Long id) {
        return null;
    }

    private UserDTO getProfesseurDto(Long id){
        return null;
    }

    private GestionnaireDto getGestionnaireDto(Long id) {
        final Optional<Gestionnaire> gestionnaireOptional = gestionnaireRepository.findById(id);
        return gestionnaireOptional.isPresent() ?
                GestionnaireDto.create(gestionnaireOptional.get()) :
                GestionnaireDto.empty();
    }

    private PreposeDto getPreposeDto(Long id) {
        final Optional<Prepose> preposeOptional = preposeRepository.findById(id);
        return preposeOptional.isPresent() ?
                PreposeDto.create(preposeOptional.get()) :
                PreposeDto.empty();
    }

    private EmprunteurDto getEmprunteurDto(Long id) {
        final Optional<Emprunteur> emprunteurOptional = emprunteurRepository.findById(id);
        return emprunteurOptional.isPresent() ?
                EmprunteurDto.create(emprunteurOptional.get()) :
                EmprunteurDto.empty();
    }

    /*
    private ProfesseurDTO getProfesseurDto(Long id) {
        final Optional<Professeur> professeurOptional = professeurRepository.findById(id);
        return professeurOptional.isPresent() ?
                ProfesseurDTO.create(professeurOptional.get()) :
                ProfesseurDTO.empty();
    }



    public ProfesseurDTO registerProfesseur(ProfesseurRegisterDTO dto) {

        if (dto.getFirstName() == null || dto.getFirstName().isBlank()) {
            throw new RuntimeException("Le prénom est obligatoire");
        }
        if (dto.getLastName() == null || dto.getLastName().isBlank()) {
            throw new RuntimeException("Le nom est obligatoire");
        }
        if (dto.getEmail() == null || !dto.getEmail().matches("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$")) {
            throw new RuntimeException("Le format du courriel est invalide");
        }
        if (dto.getPassword() == null || !dto.getPassword().matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$")) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
        }
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }
        if (userAppRepository.findUserAppByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Ce courriel est déjà associé à un compte");
        }

        Professeur professeur = Professeur.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .discipline(dto.getDiscipline())
                .build();

        return ProfesseurDTO.create(professeurRepository.save(professeur));
    } */
    }
