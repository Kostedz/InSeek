package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.*;
import com.lacouf.rsbjwt.service.util.OfferFields;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;


@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final ApplicationStageRepository applicationStageRepository;
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

        Utilisateur uploader = getAuthenticatedUser(request);
        String targetDiscipline;

        CV existingCV = documentRepository.findByUtilisateur(uploader);
        if (existingCV != null) {
            if (existingCV.getStatut().equals(StatutValidation.EN_ATTENTE)) {
                throw new BadRequestException("Votre CV est déjà en attente de validation.");
            }
            documentRepository.delete(existingCV);
        }

        logger.info("Form content: " + formContent);
        logger.info("Type: " + type);
        logger.info("Uploader: " + uploader);
        if (type.equals("CV")) {
            logger.info("Uploader is submitting a CV: " + uploader);
            targetDiscipline = targetDisciplineForCv(uploader, result).toString();
        } else {
            throw new BadRequestException("Invalid document type");
        }

        logger.info(targetDiscipline);
        Document document = createDocument(type, file, result, uploader);

        if (documentRepository.findByUtilisateur(uploader) != null && documentRepository.findByUtilisateur(uploader).getStatut() == StatutValidation.EN_ATTENTE) {
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

    @Transactional
    public DocumentValidationDTO findStudentCv(HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        Utilisateur student = getAuthenticatedUser(request);
        if (!(student instanceof Etudiant)) {
            throw new BadRequestException("Seul un étudiant peut consulter son CV");
        }

        CV cv = documentRepository.findByUtilisateur(student);
        return cv == null ? null : DocumentValidationDTO.of(cv);
    }

    @Transactional
    public DocumentFile findDocumentFile(Long documentId, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        Utilisateur requester = getAuthenticatedUser(request);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document non trouvé"));

        boolean isManager = requester instanceof Gestionnaire;
        boolean isOwner = document.getUtilisateur() != null
                && document.getUtilisateur().getEmail().equals(requester.getEmail());
        boolean isStudentWithValidatedCv = requester instanceof Etudiant
                && document instanceof OffreDeStage
                && document.getStatut() == StatutValidation.VALIDE
                && documentRepository.existsStudentCvByStatut(requester, StatutValidation.VALIDE);
        boolean isEmployerWithApplicantCv = requester instanceof Employeur
                && document instanceof CV
                && document.getStatut() == StatutValidation.VALIDE
                && document.getUtilisateur() != null
                && applicationStageRepository.existsByEtudiantIdAndEmployerId(
                document.getUtilisateur().getId(), requester.getId());
        if (!isManager && !isOwner && !isStudentWithValidatedCv && !isEmployerWithApplicantCv) {
            throw new NotFoundException("Document non trouvé");
        }

        return new DocumentFile(document.getData(), document.getContentType());
    }

    public record DocumentFile(byte[] data, String contentType) {
    }

    private Document createDocument(String type, MultipartFile file, JsonNode result, Utilisateur uploader) throws
            BadRequestException, IOException {

        return switch (type) {
            case "CV" -> CV.create(file, targetDisciplineForCv(uploader, result), uploader);

            case "OffreDeStage" -> {
                    OfferFields fields = OfferFields.from(result);
                    yield OffreDeStage.create(file, fields, uploader);
            }       default -> throw new BadRequestException("Invalid document type");
        };
    }

    public List<OffreDeStageDTO> findAllOffreDeStage(){
        return documentRepository.findOffreStageSummariesByStatut(StatutValidation.VALIDE);
    }

    public OffreDeStageDTO findOffreDeStageById(Long id){
        return documentRepository.findOffreStageSummaryById(id).
                orElseThrow(() -> new RuntimeException("Stage n'a pas été trouvé"));
    }

    public List<OffreDeStageDTO> findOffreDeStageByCompagnieName(String nomCompagnie){
            return documentRepository.findOffreStagedByNomCompagnie(nomCompagnie).
                    stream().
                    map(OffreDeStageDTO::of)
                    .toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageDiscipline(Disciplines discipline){
        return documentRepository.findOffreStageByTargetDiscipline(discipline).
                stream().
                map(OffreDeStageDTO::of)
                .toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByPosition(String position){
        return documentRepository.findOffreStageByPosition(position).
                stream().
                map(OffreDeStageDTO::of)
                .toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByMinimumSalaire(Double salaire){
        return documentRepository.findOffreStageByMinimumSalaire(salaire).
                stream().
                map(OffreDeStageDTO::of)
                .toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByDateDebutStage(LocalDate dateDebut){
        return documentRepository.findOffreStageByDateDebutStage(dateDebut).
                stream().
                map(OffreDeStageDTO::of)
                .toList();
    }

    public List<OffreDeStageDTO> findOffreDeStageByDateFinStage(LocalDate dateFin){
        return documentRepository.findOffreStageByDateFinStage(dateFin).
                stream().
                map(OffreDeStageDTO::of)
                .toList();
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        List<OffreDeStage> offers = isAuthenticated
                ? documentRepository.findOffersByEmployer(
                utilisateurService.findEntityByEmail(authentication.getName()))
                : findApprovedOffers();

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

    // holy shit. this sucked ASS to refactor. fuck you oïc.
    @Transactional
    public OffreDeStageDTO saveEmployerOffer(MultipartFile file, String result,
                                             HttpServletRequest request, Long offerId)
            throws BadRequestException, IOException, NotFoundException {
        validateFile(file);
        Utilisateur employer = getAuthenticatedUser(request);
        OfferFields fields = OfferFields.from(objectMapper.readTree(result));

        OffreDeStage offer;
        if (offerId == null) {
            offer = OffreDeStage.create(file, fields, employer);

            logger.info("Employer {} is submitting a new offer: {}", employer.getEmail(), offer);
            if (documentRepository.findByUtilisateur(employer) != null && documentRepository.findByUtilisateur(employer).getStatut() == StatutValidation.EN_ATTENTE) {
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

            existingOffer.updateFields(fields);
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

    public void validateFile(MultipartFile file) throws BadRequestException {
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
}
