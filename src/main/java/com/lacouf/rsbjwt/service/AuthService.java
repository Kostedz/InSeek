package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.GestionnaireDto;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import com.lacouf.rsbjwt.service.dto.UserDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

import static com.lacouf.rsbjwt.model.auth.Role.*;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public String login(LoginDTO loginDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword()));
        final String token = jwtTokenProvider.generateToken(authentication);
        System.out.println("JWT Token :" + token);
        return token;

    }

    //TODO ALI: ENLEVER LES CASES NULL PLUS TARD
    public UtilisateurDTO getMe(String token) {
        token = token.startsWith("Bearer") ? token.substring(7) : token;
        String email = jwtTokenProvider.getEmailFromJWT(token);
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
        return switch(utilisateur.getCredentials().getRole()){
            case EMPLOYEUR -> getEmployeurDto(utilisateur.getId());
            case GESTIONNAIRE -> getGestionnaireDto(utilisateur.getId());
            case ETUDIANT -> getEtudiantDto(utilisateur.getId());
            case PREPOSE, EMPRUNTEUR, PROFESSEUR -> null;

        };
    }

    // ALI: JE VAIS LE FAIRE PLUS TARD, POUR L'INSTANT JE LE LAISSE VIDE
    private UtilisateurDTO getEtudiantDto(Long id) {
        return null;
    }

    private UtilisateurDTO getGestionnaireDto(Long id) {
        return null;

    }

    private UtilisateurDTO getEmployeurDto(Long id) {
        return null;
    }

    private UtilisateurDTO getProfesseurDto(Long id) {
        return null;
    }

}
