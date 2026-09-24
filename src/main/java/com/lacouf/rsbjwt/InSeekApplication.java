package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class InSeekApplication implements CommandLineRunner {

    private final UtilisateurService utilisateurService;

    public InSeekApplication(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    public static void main(String[] args) {
        SpringApplication.run(InSeekApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

        RegisterDTO registerDTO = new RegisterDTO("bib", "bib", "bib@a.com", Role.ETUDIANT, "123456Aa@", "INFORMATIQUE");
        utilisateurService.register(registerDTO);


        RegisterDTO registerDTO1 = new RegisterDTO("Ubi","Soft","ubisoft@mail.com",Role.EMPLOYEUR,"123456Aa@","UbiSoft");
        utilisateurService.register(registerDTO1);
    }
}
