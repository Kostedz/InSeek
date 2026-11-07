package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.DocumentService;
import com.lacouf.rsbjwt.service.UtilisateurService;
import com.lacouf.rsbjwt.service.dto.RegisterDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.multipart.MultipartFile;

@SpringBootApplication
@EnableScheduling
public class InSeekApplication implements CommandLineRunner {

    private final UtilisateurService utilisateurService;
    private final DocumentService documentService;
    private final UtilisateurRepository utilisateurRepository;
    private static final Logger logger = LoggerFactory.getLogger(InSeekApplication.class);

    public InSeekApplication(
            UtilisateurService utilisateurService,
            DocumentService documentService,
            UtilisateurRepository utilisateurRepository
    ) {
        this.utilisateurService = utilisateurService;
        this.documentService = documentService;
        this.utilisateurRepository = utilisateurRepository;
    }

    public static void main(String[] args) {
        SpringApplication.run(InSeekApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

    }
}