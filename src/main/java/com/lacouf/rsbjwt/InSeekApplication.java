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

    public InSeekApplication(UtilisateurService utilisateurService, DocumentService documentService) {
        this.utilisateurService = utilisateurService;
        this.documentService = documentService;
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

        RegisterDTO registerDTO2 = new RegisterDTO("Admin", "Jean", "gestionnaire@inseek.com", Role.GESTIONNAIRE, "123456Aa@", "");
        utilisateurService.register(registerDTO2);

        MultipartFile file = new MockMultipartFile("cv.pdf", "cv.pdf", "application/pdf", "Dummy CV content".getBytes());
        //DocumentDTO doc = documentService.saveDocument(file, "{\"type\":\"CV\",\"email\":\"bib@a.com\",\"targetDiscipline\":\"INFORMATIQUE\"}");


    }
}