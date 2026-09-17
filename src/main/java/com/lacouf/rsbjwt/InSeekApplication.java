package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.EmprunteurRepository;
import com.lacouf.rsbjwt.repository.GestionnaireRepository;
import com.lacouf.rsbjwt.repository.PreposeRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import com.lacouf.rsbjwt.service.dto.UtilisateurDTO;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

@SpringBootApplication
public class InSeekApplication implements CommandLineRunner {

    private final GestionnaireRepository gestionnaireRepository;
    private final EmprunteurRepository emprunteurRepository;
    private final PreposeRepository preposeRepository;
    private final UserAppRepository userAppRepository;
    private final UtilisateurService utilisateurService;
    private final PasswordEncoder passwordEncoder;

    public InSeekApplication(GestionnaireRepository gestionnaireRepository, EmprunteurRepository emprunteurRepository, PreposeRepository preposeRepository, UserAppRepository userAppRepository, UtilisateurService utilisateurService, PasswordEncoder passwordEncoder) {
        this.gestionnaireRepository = gestionnaireRepository;
        this.emprunteurRepository = emprunteurRepository;
        this.preposeRepository = preposeRepository;
        this.userAppRepository = userAppRepository;
        this.utilisateurService = utilisateurService;
        this.passwordEncoder = passwordEncoder;
    }

    public static void main(String[] args) {
        SpringApplication.run(InSeekApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        gestionnaireRepository.save(
                Gestionnaire.builder()
                        .firstName("Gerard")
                        .lastName("Biblio")
                        .email("l@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .matricule("0000001")
                        .phoneNumber("123-456-7890")
                        .build()
        );
        emprunteurRepository.save(
                Emprunteur.builder()
                        .firstName("Isidor")
                        .lastName("Teurteur")
                        .email("ll@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .since(LocalDate.of(2020, 10,20))
                        .build()
        );
        preposeRepository.save(
                Prepose.builder()
                        .firstName("Chandeuse")
                        .lastName("Lixor")
                        .email("lll@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .passeKey("12345")
                        .build()
        );

        RegisterDTO registerDTO = new RegisterDTO("bib", "bib", "bib@a.com", Role.ETUDIANT, "123456Aa@", "123456Aa@", Disciplines.INFORMATIQUE);
        utilisateurService.register(registerDTO);
        final Optional<UserApp> userAppByEmail = userAppRepository.findUserAppByEmail("l@l.com");
        userAppByEmail.ifPresent(userApp -> System.out.println("user " + userAppByEmail));

    }
}
