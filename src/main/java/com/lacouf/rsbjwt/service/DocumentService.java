package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;


@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final UtilisateurService utilisateurService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Transactional
    public DocumentDTO saveDocument(MultipartFile file, String formContent, HttpServletRequest request) throws BadRequestException, IOException, NotFoundException {
        JsonNode result = objectMapper.readTree(formContent);
        String type = result.get("type").asString();
        if ("OffreDeStage".equals(type)) {
            return saveEmployerOffer(file, formContent, request, null);
        }

        String email = jwtTokenProvider.getEmailFromJWT(request.getHeader("Authorization").substring(7));
        Utilisateur uploader = utilisateurService.findEntityByEmail(email);
        String targetDiscipline;

        CV existingCV = documentRepository.findByUtilisateur(uploader);
        if (existingCV != null && existingCV.getStatut().equals(StatutValidation.VALIDE)) {
            documentRepository.delete(existingCV);
        }

        logger.info("Form content: " + formContent);
        logger.info("Type: " + type);
        logger.info("Uploader: " + uploader);
        if (type.equals("CV")) {
            logger.info("Uploader is submitting a CV: " + uploader);
            targetDiscipline = targetDisciplineForCv(uploader, result).toString();
        } else if (type.equals("OffreDeStage")) {
            logger.info("Uploader is an instance of Etudiant: " + uploader);
            targetDiscipline = ((Etudiant) uploader).getDiscipline().toString();
        } else {
            throw new BadRequestException("Invalid document type");
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

    private Document createDocument(String type, MultipartFile file, JsonNode result, Utilisateur uploader) throws BadRequestException, IOException {
        String targetDiscipline;

        return switch (type) {
            case "CV" -> {
                targetDiscipline = targetDisciplineForCv(uploader, result).toString();
                yield CV.builder()
                        .fileName(file.getOriginalFilename())
                        .targetDiscipline(Disciplines.valueOf(targetDiscipline))
                        .data(file.getBytes())
                        .contentType(file.getContentType())
                        .size(file.getSize())
                        .utilisateur(uploader)
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
                        .employeur(uploader)
                        .nomEntreprise(result.get("nomEntreprise") == null ? null : result.get("nomEntreprise").asString())
                        .position(position)
                        .descriptionPosition(descriptionPosition)
                        .dateDebutStage(dateDebutStage)
                        .dateFinStage(dateFinStage)
                        .adresseEntreprise(adresseEntreprise)
                        .salaire(salaire)
                        .contactName(result.get("contactName") == null ? null : result.get("contactName").asString())
                        .contactPhone(result.get("contactPhone") == null ? null : result.get("contactPhone").asString())
                        .build();
            }
            default -> throw new BadRequestException("Invalid document type");
        };
    }

    private Disciplines targetDisciplineForCv(Utilisateur uploader, JsonNode result) throws BadRequestException {
        if (uploader instanceof Etudiant etudiant) {
            return etudiant.getDiscipline();
        }

        if (uploader instanceof Gestionnaire) {
            String requestedDiscipline = result.get("targetDiscipline") == null
                    ? null
                    : result.get("targetDiscipline").asString();
            if (requestedDiscipline == null || requestedDiscipline.isBlank()) {
                return Disciplines.INFORMATIQUE;
            }

            try {
                return Disciplines.valueOf(requestedDiscipline);
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException("Discipline de CV invalide");
            }
        }

        throw new BadRequestException("Seul un étudiant ou le compte développeur peut téléverser un CV");
    }

    @Transactional
    public List<OffreDeStageDTO> findOffersForEmployer(HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        List<OffreDeStage> offers = findApprovedOffers();
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                Utilisateur user = getAuthenticatedUser(request);
                offers = documentRepository.findOffersByEmployer(user);
            } catch (BadRequestException | NotFoundException | RuntimeException ignored) {
                // Public visitors fall back to approved offers.
            }
        }
        return offers
                .stream()
                .map(OffreDeStageDTO::of)
                .toList();
    }

    private List<OffreDeStage> findApprovedOffers() {
        return documentRepository.findByStatut(StatutValidation.VALIDE).stream()
                .filter(OffreDeStage.class::isInstance)
                .map(OffreDeStage.class::cast)
                .toList();
    }

    @Transactional
    public OffreDeStageDTO saveEmployerOffer(MultipartFile file, String formContent,
                                             HttpServletRequest request, Long offerId)
            throws BadRequestException, IOException, NotFoundException {
        validateOfferFile(file);
        Utilisateur employer = getAuthenticatedUser(request);
        OfferFields fields = parseOfferFields(formContent);

        OffreDeStage offer;
        if (offerId == null) {
            offer = OffreDeStage.builder()
                    .fileName(file.getOriginalFilename())
                    .targetDiscipline(fields.targetDiscipline())
                    .data(file.getBytes())
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .employeur(employer)
                    .nomEntreprise(fields.nomEntreprise())
                    .position(fields.position())
                    .descriptionPosition(fields.descriptionPosition())
                    .dateDebutStage(fields.dateDebutStage())
                    .dateFinStage(fields.dateFinStage())
                    .adresseEntreprise(fields.adresseEntreprise())
                    .salaire(fields.salaire())
                    .contactName(fields.contactName())
                    .contactPhone(fields.contactPhone())
                    .build();

            if (documentRepository.existsByFileNameAndTargetDiscipline(
                    offer.getFileName(), offer.getTargetDiscipline())) {
                throw new BadRequestException("Document with the same name and target discipline already exists");
            }
        } else {
            Document document = documentRepository.findById(offerId)
                    .orElseThrow(() -> new NotFoundException("Offre non trouvée"));
            if (!(document instanceof OffreDeStage existingOffer)) {
                throw new NotFoundException("Offre non trouvée");
            }
            if (existingOffer.getUtilisateur() == null
                    || !existingOffer.getUtilisateur().getEmail().equals(employer.getEmail())) {
                throw new NotFoundException("Offre non trouvée");
            }
            if (existingOffer.getStatut() != StatutValidation.VALIDE) {
                throw new BadRequestException("Cette offre ne peut pas être modifiée dans son état actuel");
            }

            existingOffer.setFileName(file.getOriginalFilename());
            existingOffer.setTargetDiscipline(fields.targetDiscipline());
            existingOffer.setData(file.getBytes());
            existingOffer.setContentType(file.getContentType());
            existingOffer.setSize(file.getSize());
            existingOffer.setNomEntreprise(fields.nomEntreprise());
            existingOffer.setPosition(fields.position());
            existingOffer.setDescriptionPosition(fields.descriptionPosition());
            existingOffer.setDateDebutStage(fields.dateDebutStage());
            existingOffer.setDateFinStage(fields.dateFinStage());
            existingOffer.setAdresseEntreprise(fields.adresseEntreprise());
            existingOffer.setSalaire(fields.salaire());
            existingOffer.setContactName(fields.contactName());
            existingOffer.setContactPhone(fields.contactPhone());
            existingOffer.setStatut(StatutValidation.EN_ATTENTE);
            existingOffer.setCommentaireRejet(null);
            existingOffer.setVersion(existingOffer.getVersion() + 1);
            existingOffer.setUpdatedAt(LocalDateTime.now());
            offer = existingOffer;
        }

        documentRepository.save(offer);
        return OffreDeStageDTO.of(offer);
    }

    private Utilisateur getAuthenticatedUser(HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new BadRequestException("Invalid JWT token");
        }

        String email = jwtTokenProvider.getEmailFromJWT(authorization.substring(7));
        return utilisateurService.findEntityByEmail(email);
    }

    private void validateOfferFile(MultipartFile file) throws BadRequestException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds the maximum limit of 5 MB");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!"application/pdf".equalsIgnoreCase(file.getContentType()) && !filename.endsWith(".pdf")) {
            throw new BadRequestException("Only PDF files are allowed");
        }
    }

    private OfferFields parseOfferFields(String formContent) throws BadRequestException {
        try {
            JsonNode result = objectMapper.readTree(formContent);
            if (result == null || !"OffreDeStage".equals(requiredString(result, "type"))) {
                throw new BadRequestException("Invalid document type");
            }

            LocalDate startDate = parseDate(result, "dateDebutStage");
            LocalDate endDate = parseDate(result, "dateFinStage");
            if (endDate.isBefore(startDate)) {
                throw new BadRequestException("La date de fin doit suivre la date de début");
            }

            Disciplines discipline;
            try {
                discipline = Disciplines.valueOf(requiredString(result, "targetDiscipline").toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException("Invalid target discipline");
            }

            Double salary = optionalDouble(result, "salaire");
            if (salary != null && salary < 0) {
                throw new BadRequestException("Salary cannot be negative");
            }

            return new OfferFields(
                    requiredString(result, "nomEntreprise"),
                    requiredString(result, "position"),
                    requiredString(result, "descriptionPosition"),
                    startDate,
                    endDate,
                    requiredString(result, "adresseEntreprise"),
                    salary,
                    optionalString(result, "contactName"),
                    optionalString(result, "contactPhone"),
                    discipline
            );
        } catch (BadRequestException exception) {
            throw exception;
        } catch (DateTimeParseException | NullPointerException | IllegalStateException exception) {
            throw new BadRequestException("Invalid internship offer data");
        }
    }

    private String requiredString(JsonNode result, String field) throws BadRequestException {
        String value = optionalString(result, field);
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Field '" + field + "' is required");
        }
        return value.trim();
    }

    private String optionalString(JsonNode result, String field) {
        JsonNode node = result.get(field);
        return node == null || node.isNull() ? null : node.asString();
    }

    private Double optionalDouble(JsonNode result, String field) {
        JsonNode node = result.get(field);
        return node == null || node.isNull() || node.asString().isBlank() ? null : node.asDouble();
    }

    private LocalDate parseDate(JsonNode result, String field) throws BadRequestException {
        String value = requiredString(result, field);
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Invalid date for field '" + field + "'");
        }
    }

    private record OfferFields(
            String nomEntreprise,
            String position,
            String descriptionPosition,
            LocalDate dateDebutStage,
            LocalDate dateFinStage,
            String adresseEntreprise,
            Double salaire,
            String contactName,
            String contactPhone,
            Disciplines targetDiscipline
    ) {
    }
}
