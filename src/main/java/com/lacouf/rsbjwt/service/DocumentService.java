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
import java.time.LocalDate;
import java.util.List;


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
        Utilisateur uploader = utilisateurService.findEntityByEmail(email);

        JsonNode result = objectMapper.readTree(formContent);
        String type = result.get("type").asString();
        String targetDiscipline;
        logger.info("Form content: " + formContent);
        logger.info("Type: " + type);
        logger.info("Uploader: " + uploader);
        if (type.equals("CV")) {
            logger.info("Uploader is an instance of Etudiant: " + uploader);
            targetDiscipline = ((Etudiant) uploader).getDiscipline().toString();
        } else {
            logger.info("Uploader is not an instance of EtudiantDTO: " + uploader);
            targetDiscipline = result.get("targetDiscipline").asString();
        }

        logger.info(targetDiscipline);
        Document document = createDocument(type, file, result, uploader);

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

    public Document createDocument(String type, MultipartFile file, JsonNode result, Utilisateur uploader) throws BadRequestException, IOException, NotFoundException {
        String targetDiscipline;

        return switch (type) {
            case "CV" -> {
                targetDiscipline = ((Etudiant) uploader).getDiscipline().toString();
                yield CV.builder()
                        .fileName(file.getOriginalFilename())
                        .targetDiscipline(Disciplines.valueOf(targetDiscipline))
                        .data(file.getBytes())
                        .contentType(file.getContentType())
                        .size(file.getSize())
                        .utilisateur((Etudiant) uploader)
                        .build();
            }

            case "OffreDeStage" -> {
                String position = result.get("position").asString();
                String descriptionPosition = result.get("descriptionPosition").asString();
                LocalDate dateDebutStage = LocalDate.parse(result.get("dateDebutStage").asString());
                LocalDate dateFinStage = LocalDate.parse(result.get("dateFinStage").asString());
                String adresseEntreprise = result.get("adresseEntreprise").asString();
                Double salaire = result.get("salaire").asDouble();
                targetDiscipline = result.get("targetDiscipline").asString();
                yield OffreDeStage.builder()
                        .fileName(file.getOriginalFilename())
                        .targetDiscipline(Disciplines.valueOf(targetDiscipline))
                        .data(file.getBytes())
                        .contentType(file.getContentType())
                        .size(file.getSize())
                        .employeur((Employeur) uploader)
                        .position(position)
                        .descriptionPosition(descriptionPosition)
                        .dateDebutStage(dateDebutStage)
                        .dateFinStage(dateFinStage)
                        .adresseEntreprise(adresseEntreprise)
                        .salaire(salaire)
                        .build();
            }
            default -> throw new BadRequestException("Invalid document type");
        };
    }

    public List<OffreDeStageDTO> findAllOffreDeStage(){
        return documentRepository.findAllOffreStage().
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }

    public OffreDeStageDTO findOffreDeStageById(Long id){
        return documentRepository.findOffreStageById(id).
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).
                orElseThrow(() -> new RuntimeException("Stage n'a pas été trouvé"));
    }

    public List<OffreDeStageDTO> findOffreDeStageByCompagnieName(String nomCompagnie){
            return documentRepository.findOffreStagedByNomCompagnie(nomCompagnie).
                    stream().
                    map(o -> new OffreDeStageDTO(
                            o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                            o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                            o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                            o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                    )).toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageDiscipline(Disciplines discipline){
        return documentRepository.findOffreStageByTargetDiscipline(discipline).
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByPosition(String position){
        return documentRepository.findOffreStageByPosition(position).
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByMinimumSalaire(Double salaire){
        return documentRepository.findOffreStageByMinimumSalaire(salaire).
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByDateDebutStage(LocalDate dateDebut){
        return documentRepository.findOffreStageByDateDebutStage(dateDebut).
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByDateFinStage(LocalDate dateFin){
        return documentRepository.findOffreStageByDateFinStage(dateFin).
                stream().
                map(o -> new OffreDeStageDTO(
                        o.getId(),o.getFileName(),o.getUtilisateur().getEmail(),o.getNomEntreprise(),
                        o.getPosition(),o.getDescriptionPosition(), o.getDateDebutStage(), o.getDateFinStage(),
                        o.getAdresseEntreprise(), o.getStatut(), o.getCommentaireRejet(), o.getSalaire(), o.getTargetDiscipline(),
                        o.getContactName(),o.getContactPhone(),o.getVersion(),o.getUpdatedAt()
                )).toList();
    }
}
