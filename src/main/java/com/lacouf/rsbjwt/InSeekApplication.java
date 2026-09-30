package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.DocumentDTO;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@SpringBootApplication
public class InSeekApplication implements CommandLineRunner {

    private final UtilisateurService utilisateurService;
    private final DocumentService documentService;
    private static final Logger logger = LoggerFactory.getLogger(InSeekApplication.class);
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public InSeekApplication(UtilisateurService utilisateurService, DocumentService documentService, UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder) {
        this.utilisateurService = utilisateurService;
        this.documentService = documentService;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public static void main(String[] args) {
        SpringApplication.run(InSeekApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

        RegisterDTO registerDTO = new RegisterDTO("bib", "bib", "bib@a.com", Role.ETUDIANT, "123456Aa@", "INFORMATIQUE");
        utilisateurService.register(registerDTO);


        RegisterDTO registerDTO1 = new RegisterDTO("Ubi", "Soft", "ubisoft@mail.com", Role.EMPLOYEUR, "123456Aa@", "UbiSoft");
        utilisateurService.register(registerDTO1);

        MultipartFile file = new MockMultipartFile("cv.pdf", "cv.pdf", "application/pdf", "Dummy CV content".getBytes());
        DocumentDTO doc = documentService.saveDocument(file, "{\"type\":\"CV\",\"email\":\"bib@a.com\",\"targetDiscipline\":\"INFORMATIQUE\"}");

        ///creer gestionnaire pour le mettre dans save.
        Gestionnaire gestionnaire = Gestionnaire.builder()
                .nom("Admin")
                .prenom("Gestionnaire")
                .email("gestionnaire@a.com")
                .password(passwordEncoder.encode("123456Aa@"))
                .build();

        utilisateurRepository.save(gestionnaire);
    }
}