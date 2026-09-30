package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;


@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final UtilisateurService utilisateurService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    public DocumentDTO saveDocument(MultipartFile file, String formContent, HttpServletRequest request) throws BadRequestException, IOException, NotFoundException {
        String email = jwtTokenProvider.getEmailFromJWT(request.getHeader("Authorization").substring(7));
        UtilisateurDTO uploader = utilisateurService.findByEmail(email);

        JsonNode result = objectMapper.readTree(formContent);
        String type = result.get("type").asString();
        String targetDiscipline = result.get("targetDiscipline").asString() != null ? result.get("targetDiscipline").asString()
                : uploader != null ? ((EtudiantDTO) uploader).discipline().toString() : null;

        logger.info(targetDiscipline);
        Document document = createDocument(type, file, targetDiscipline, uploader);

        if (documentRepository.existsByFileNameAndTargetDiscipline(document.getFileName(), document.getTargetDiscipline())) {
            throw new BadRequestException("Document with the same name and target discipline already exists");
        }

        documentRepository.save(document);
        return toDTO(document);
    }


    public DocumentDTO toDTO(Document document) {
        return switch (document) {
            case CV cv -> CVDTO.of(cv);
            case OffreDeStage offre -> OffreDeStageDTO.of(offre);
            default -> throw new IllegalArgumentException("Unknown document type");
        };
    }

    private Document createDocument(String type, MultipartFile file, String targetDiscipline, UtilisateurDTO uploader) throws BadRequestException, IOException, NotFoundException {
        Utilisateur utilisateur = utilisateurService.toEntity(utilisateurService.findByEmail(uploader.email()));

        return switch (type) {
            case "CV" -> CV.builder()
                    .fileName(file.getOriginalFilename())
                    .targetDiscipline(Disciplines.valueOf(targetDiscipline))
                    .data(file.getBytes())
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .utilisateur((Etudiant) utilisateur)
                    .build();

//            case "OffreDeStage" -> OffreDeStage.builder()
//                    .fileName(file.getOriginalFilename())
//                    .targetDiscipline(Disciplines.valueOf(targetDiscipline))
//                    .data(file.getBytes())
//                    .contentType(file.getContentType())
//                    .size(file.getSize())
//                    .email(uploader.email())
//                    .employeur(1) //Ajouter id de employeur
//                    .position()
//                    .descriptionPosition()
//                    .dateDebutStage()
//                    .dateFinStage()
//                    .adresseEntreprise()
//                    .salaire()
//                    .build();

            default -> throw new BadRequestException("Invalid document type");
        };
    }
}
