package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UtilisateurService {
    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UtilisateurDTO inscription(RegisterDTO registerDTO) throws BadRequestException {
        registrationVerification(registerDTO);

        Utilisateur utilisateur = toEntity(registerDTO);
        utilisateurRepository.save(utilisateur);
        return toDTO(utilisateur);
    }

    @Transactional
    public UtilisateurDTO findByEmail(String email) throws BadRequestException {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("L'email ne peut pas être null ou vide.");
        }

        Utilisateur user = utilisateurRepository.findByEmail(email);
        return toDTO(user);
    }

    public void registrationVerification(RegisterDTO dto ) throws BadRequestException {

        if (dto == null) {
            throw new BadRequestException("Le DTO d'inscription est null.");
        }
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
        if (!dto.password().equals(dto.confirmedPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }
        if (utilisateurRepository.findByEmail(dto.email()) != null) {
            throw new BadRequestException("Ce courriel est déjà associé à un compte");
        }
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
                    .discipline(registerDTO.discipline())
                    .password(passwordEncoder.encode(registerDTO.password()))
                    .build();
        }

        throw new BadRequestException("Type de DTO non pris en charge pour la conversion en entité.");
    }
}
