package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev.email:dev@inseek.local}")
    private String email;

    @Value("${app.dev.password:DevInSeek!2026}")
    private String password;

    @Override
    public void run(String... args) {
        if (utilisateurRepository.findByEmail(email) == null) {
            utilisateurRepository.save(new Gestionnaire(
                    null,
                    "Dev",
                    "InSeek",
                    email,
                    passwordEncoder.encode(password)
            ));
        }
    }
}
