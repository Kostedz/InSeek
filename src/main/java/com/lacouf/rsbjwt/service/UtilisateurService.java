package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UtilisateurService {
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;


    @Transactional
    public String register(RegisterDTO registerDTO) throws BadRequestException {
        if (registerDTO == null) {
            throw new BadRequestException("Le DTO d'inscription est null.");
        }

        if (!registrationVerification(registerDTO)) {
            throw new BadRequestException("La vérification d'inscription a échoué.");
        }

        Utilisateur utilisateur = toEntity(registerDTO);
        utilisateurRepository.save(utilisateur);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerDTO.email(), registerDTO.password()));
        return jwtTokenProvider.generateToken(authentication);
    }

    @Transactional
    public String login(LoginDTO loginDTO) throws BadRequestException, NotFoundException {
        if (loginDTO == null) {
            throw new BadRequestException("Le DTO de connexion est null.");
        }
        if (utilisateurRepository.findByEmail(loginDTO.getEmail()) == null) {
            throw new NotFoundException("L'utilisateur n'existe pas.");
        }
         Authentication authentication = authenticationManager.authenticate(
                 new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword()));
        return jwtTokenProvider.generateToken(authentication);
    }

    @Transactional
    public UtilisateurDTO getMe(String token) throws BadRequestException {
        token = token.startsWith("Bearer") ? token.substring(7) : token;
        String email = jwtTokenProvider.getEmailFromJWT(token);
        Utilisateur user = utilisateurRepository.findByEmail(email);

        return toDTO(user);
    }

    public boolean registrationVerification(RegisterDTO dto ) throws BadRequestException {

        if (dto.prenom() == null || dto.prenom().isBlank()) {
            throw new BadRequestException("Le prénom est obligatoire");
        }
        if (dto.nom() == null || dto.nom().isBlank()) {
            throw new BadRequestException("Le nom est obligatoire");
        }
        if (dto.email() == null || !dto.email().matches("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Le format du courriel est invalide");
        }
        if (dto.password() == null || !dto.password().matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$")) {
            throw new BadRequestException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
        }
        if (utilisateurRepository.findByEmail(dto.email()) != null) {
            throw new BadRequestException("Ce courriel est déjà associé à un compte");
        }
        return true;
    }

    public UtilisateurDTO toDTO(Utilisateur utilisateur) throws BadRequestException {
        if (utilisateur == null) {
            return null;
        }

        if (utilisateur instanceof Etudiant etudiant) {
            return EtudiantDTO.of(etudiant);
        }

        throw new BadRequestException("Type d'entité non pris en charge pour la conversion en DTO.");
    }

    public Utilisateur toEntity(RegisterDTO registerDTO) throws BadRequestException {
        if (registerDTO == null) {
            return null;
        }

        if (registerDTO.role() == Role.ETUDIANT) {
            return Etudiant.builder()
                    .nom(registerDTO.nom())
                    .prenom(registerDTO.prenom())
                    .email(registerDTO.email())
                    .discipline(Disciplines.valueOf(registerDTO.affiliation()))
                    .password(passwordEncoder.encode(registerDTO.password()))
                    .build();
        }

        throw new BadRequestException("Type de DTO non pris en charge pour la conversion en entité.");
    }

}
