package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.EtudiantDTO;
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


    // TODO: Tell the FE guys to call findByEmail when email is validated in the form
    @Transactional
    public UtilisateurDTO inscription(RegisterDTO registerDTO) throws BadRequestException {
        if (registerDTO == null) {
            throw new BadRequestException("Le DTO d'inscription est null.");
        }

        Utilisateur utilisateur = toEntity(registerDTO);
        utilisateurRepository.save(utilisateur);
        return toDTO(utilisateur);
    }

    // TODO: Rename to findByEmail
    @Transactional
    public EtudiantDTO findEtudiantByEmail(String email) throws BadRequestException {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("L'email ne peut pas être null ou vide.");
        }

        Etudiant etudiant = (Etudiant) utilisateurRepository.findByEmail(email);
        return EtudiantDTO.of(etudiant);
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
