package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.ContratDTO;
import com.lacouf.rsbjwt.service.dto.CreateContratDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantEligibleContratDTO;
import com.lacouf.rsbjwt.service.dto.PreRemplirContratDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContratService {

    private final ContratRepository contratRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationStageRepository applicationStageRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public ContratDTO signContract(Long contractId, HttpServletRequest request) throws NotFoundException, BadRequestException, ConflictException {
        Contract contract = contratRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Contrat non trouvé "));

        Utilisateur user = getAuthUser(request);

        validateUserRelatedToContract(user, contract);
        if (user instanceof Etudiant student) {
            utilisateurRepository.lockEtudiantById(student.getId())
                    .orElseThrow(() -> new NotFoundException("Étudiant introuvable."));
            if (contratRepository.existsByStudentIdAndContractStatusInAndContractIdNot(
                    student.getId(),
                    List.of(StatutContrat.SIGNED_BY_STUDENT, StatutContrat.SIGNED_BY_EMPLOYER,
                            StatutContrat.SIGNED_BY_GESTIONNAIRE, StatutContrat.EXECUTED),
                    contractId)) {
                throw new ConflictException("Un étudiant ne peut signer qu'un seul contrat.");
            }
        }
        updateContractStatusBasedOnUser(user, contract);

        contratRepository.save(contract);
        return ContratDTO.of(contract);
    }

    @Transactional(readOnly = true)
    public List<ContratDTO> listerContratsEtudiant(HttpServletRequest request) throws BadRequestException {
        Utilisateur user = getAuthUser(request);
        if (!(user instanceof Etudiant student)) {
            throw new BadRequestException("Cette liste est réservée aux étudiants.");
        }
        return contratRepository.findByStudentIdOrderByDateCreationDesc(student.getId())
                .stream()
                .map(ContratDTO::of)
                .toList();
    }

    private Utilisateur getAuthUser(HttpServletRequest request) throws BadRequestException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Jeton d'authentification manquant.");
        }
        String email = jwtTokenProvider.getEmailFromJWT(authHeader.substring(7));
        return utilisateurRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public List<EtudiantEligibleContratDTO> getEtudiantsEligibles() {
        List<Etudiant> etudiants = utilisateurRepository
                .findEtudiantsByStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND);

        List<EtudiantEligibleContratDTO> result = new ArrayList<>();

        for (Etudiant student : etudiants) {
            List<OffreDeStage> offresAcceptees = findAcceptedOffersForStudent(student.getId());

            for (OffreDeStage offer : offresAcceptees) {
                result.add(toEtudiantEligibleDTO(student, offer));
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public PreRemplirContratDTO getDonneesPreRemplies(Long studentId, Long offerId) throws NotFoundException, BadRequestException {
        Etudiant student = findStudent(studentId);
        checkStudentHasFoundInternship(student);

        OffreDeStage offer = requireAcceptedOffer(studentId,offerId);
        Employeur employer = findEmployerFromOffer(offer);
        Professeur teacher = findAssignedTeacher(student.getDiscipline());

        return toPreRemplirContratDTO(student, offer, employer, teacher);
    }

    @Transactional
    public ContratDTO creerContrat(CreateContratDTO createContratDTO, HttpServletRequest request) throws NotFoundException, BadRequestException, ConflictException {

        validateRequiredFields(createContratDTO);
        validateDates(createContratDTO.internshipStartingDate(), createContratDTO.internshipEndingDate());

        Gestionnaire admin = getConnectedGestionnaire(request);
        Etudiant student = findStudent(createContratDTO.studentId());
        checkStudentHasFoundInternship(student);

        OffreDeStage internshipOffer = requireAcceptedOffer(student.getId(),createContratDTO.offerId());
        checkNoContractExists(student, internshipOffer);

        Employeur employer = requireEmployerFromOffer(internshipOffer);
        Professeur teacher = findAssignedTeacher(student.getDiscipline());

        Contract contract = buildContract(createContratDTO, student, internshipOffer, employer, teacher, admin);
        return ContratDTO.of(contratRepository.save(contract));
    }

    @Transactional(readOnly = true)
    public List<ContratDTO> listerContrats() {
        return contratRepository.findAllByOrderByDateCreationDesc()
                .stream()
                .map(ContratDTO::of)
                .toList();
    }

    //donne le detail d'un contrat
    @Transactional(readOnly = true)
    public ContratDTO getContrat(Long id) throws NotFoundException {
        Contract contract = contratRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contrat non trouvé "));
        return ContratDTO.of(contract);
    }



//methodes pour eligibleContratDTO
    private EtudiantEligibleContratDTO toEtudiantEligibleDTO(Etudiant student,OffreDeStage offer) {
        return EtudiantEligibleContratDTO.of(
                student,
                hasContractForOffer(student,offer),
                offer.getId(),
                offer.getPosition(),
                offer.getNomEntreprise()
        );
    }

    private boolean hasContractForOffer(Etudiant student, OffreDeStage internshipOffer) {
        return internshipOffer != null
                && contratRepository.existsByStudentIdAndInternshipOfferId(student.getId(), internshipOffer.getId());
    }

    //methodes pour preremplissages données
    private PreRemplirContratDTO toPreRemplirContratDTO(Etudiant student, OffreDeStage internshipOffer,
                                                        Employeur employer, Professeur teacher) {
        String employerFullName = fullName(employer, "");

        return PreRemplirContratDTO.builder()
                .studentName(fullName(student, ""))
                .fieldOfStudy(student.getDiscipline() != null ? student.getDiscipline().name() : "")
                .companyName(companyNameForContract(internshipOffer, employer))
                .employerName(employerFullName)
                .offerTitle(internshipOffer.getPosition())
                .supervisorName(supervisorNameForContract(internshipOffer, employer))                .assignedTeacherName(fullName(teacher, "Non assigné"))
                .internshipStartDate(proposedStartDate(internshipOffer))
                .internshipEndDate(proposedEndDate(internshipOffer))
                .weeklyHours(35)
                .hourlySalary(internshipOffer.getSalaire() != null ? internshipOffer.getSalaire() : 0.0)
                .location(internshipOffer.getAdresseEntreprise() != null ? internshipOffer.getAdresseEntreprise() : "")
                .build();
    }
        //utile pour toPreRemplirContratDTO
    private String fullName(Utilisateur user, String valueIfMissing) {
        if (user == null) {
            return valueIfMissing;
        }
        return (user.getPrenom() + " " + user.getNom()).trim();
    }

        //utile pour toPreRemplirContratDTO
    private String companyNameForContract(OffreDeStage internshipOffer, Employeur employer) {
        if (internshipOffer.getNomEntreprise() != null) {
            return internshipOffer.getNomEntreprise();
        }
        if (employer != null) {
            return employer.getNomCompagnie();
        }
        return "";
    }

        //prend le nom de employeur qui recrute par defaut, mais a voir si c'est bon.
        //utile pour toPreRemplirContratDTO et creerContrat
    private String supervisorNameForContract(OffreDeStage internshipOffer, Employeur employer) {
        if (internshipOffer.getContactName() != null) {
            return internshipOffer.getContactName();
        }
        return fullName(employer, "");
    }

        //utile pour toPreRemplirContratDTO
    private LocalDate proposedStartDate(OffreDeStage internshipOffer) {
        if (internshipOffer.getDateDebutStage() != null) {
            return internshipOffer.getDateDebutStage();
        }
        return LocalDate.now().plusDays(14);
    }

        //utile pour toPreRemplirContratDTO
    private LocalDate proposedEndDate(OffreDeStage internshipOffer) {
        if (internshipOffer.getDateFinStage() != null) {
            return internshipOffer.getDateFinStage();

        }
        return LocalDate.now().plusMonths(3);
    }


    // methodes pour creerContrat
    private void checkNoContractExists(Etudiant student, OffreDeStage internshipOffer) throws ConflictException {
        if (hasContractForOffer(student, internshipOffer)) {
            throw new ConflictException("Un contrat actif existe déjà pour cet étudiant et cette offre.");
        }
    }

    private Employeur requireEmployerFromOffer(OffreDeStage internshipOffer) throws NotFoundException {
        Employeur employer = findEmployerFromOffer(internshipOffer);

        if (employer == null) {
            throw new NotFoundException("Employeur lié à l'offre introuvable.");
        }
        return employer;
    }

    private Contract buildContract(CreateContratDTO createContratDTO, Etudiant student, OffreDeStage internshipOffer,
                                   Employeur employer, Professeur teacher, Gestionnaire admin) {
        return Contract.builder()
                .student(student)
                .employer(employer)
                .internshipOffer(internshipOffer)
                .admin(admin)
                .teacher(teacher)
                .supervisorName(supervisorNameForContract(internshipOffer, employer))
                .startingDate(createContratDTO.internshipStartingDate())
                .endingDate(createContratDTO.internshipEndingDate())
                .weeklyHours(createContratDTO.weeklyHours())
                .hourlySalary(createContratDTO.hourlySalary() != null ? createContratDTO.hourlySalary() : 0.0)
                .internshipLocation(createContratDTO.internshipLocation().trim())
                .contractStatus(StatutContrat.PENDING_SIGNATURE)
                .dateCreation(LocalDateTime.now())
                .build();
    }



    //methodes utilitaires
    private void validateRequiredFields(CreateContratDTO createContratDTO) throws BadRequestException {
        if (createContratDTO == null) throw new BadRequestException("Les données du contrat sont requises.");
        if (createContratDTO.studentId() == null) throw new BadRequestException("L'identifiant de l'étudiant est requis.");
        if (createContratDTO.internshipStartingDate() == null) throw new BadRequestException("La date de début est requise.");
        if (createContratDTO.internshipEndingDate() == null) throw new BadRequestException("La date de fin est requise.");
        if (createContratDTO.weeklyHours() <= 0)
            throw new BadRequestException("Le nombre d'heures par semaine doit être supérieur à 0.");
        if (createContratDTO.internshipLocation() == null || createContratDTO.internshipLocation().isBlank())
            throw new BadRequestException("Le lieu est requis.");
        if (createContratDTO.hourlySalary() != null && createContratDTO.hourlySalary() < 0)
            throw new BadRequestException("La rémunération ne peut pas être négative.");
    }

    private void validateDates(LocalDate internshipStartingDate, LocalDate internshipEndingDate) throws BadRequestException {
        if (internshipStartingDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("La date de début ne peut pas être dans le passé.");
        }
        if (!internshipEndingDate.isAfter(internshipStartingDate)) {
            throw new BadRequestException("La date de fin doit être strictement postérieure à la date de début.");
        }
    }

    private void validateUserRelatedToContract(Utilisateur user, Contract contract) throws BadRequestException {
        if (user instanceof Etudiant student) {
            if (!student.getId().equals(contract.getStudent().getId())) {
                throw new BadRequestException("L'utilisateur connecté n'est pas l'étudiant associé à ce contrat.");
            }
        } else if (user instanceof Gestionnaire admin) {
            if (!admin.getId().equals(contract.getAdmin().getId())) {
                throw new BadRequestException("L'utilisateur connecté n'est pas le gestionnaire associé à ce contrat.");
            }
        } else {
            throw new BadRequestException("L'utilisateur connecté n'est pas rattaché à ce contrat.");
        }
    }

    private void updateContractStatusBasedOnUser(Utilisateur user, Contract contract) throws BadRequestException {
       switch (user.getClass().getSimpleName()) {
            case "Etudiant":
                if (contract.getContractStatus() != StatutContrat.PENDING_SIGNATURE) {
                    throw new BadRequestException("Le contrat ne peut pas être signé dans son état actuel.");
                } else {
                    contract.setContractStatus(StatutContrat.SIGNED_BY_STUDENT);
                }
                break;
            case "Gestionnaire":
                if (contract.getContractStatus() != StatutContrat.SIGNED_BY_EMPLOYER) {
                    throw new BadRequestException("Le contrat ne peut pas être signé dans son état actuel.");
                } else {
                    contract.setContractStatus(StatutContrat.SIGNED_BY_GESTIONNAIRE);
                }
                break;
            default:
                throw new BadRequestException("Utilisateur non reconnu.");
        }
    }

    private void checkStudentHasFoundInternship(Etudiant student) throws BadRequestException {
        if (student.getStatutRecherche() != StatutRechercheEtudiant.INTERNSHIP_FOUND) {
            throw new BadRequestException("L'étudiant n'a pas le statut STAGE TROUVÉ.");
        }
    }


    private Gestionnaire getConnectedGestionnaire(HttpServletRequest request) throws NotFoundException, BadRequestException {
        Utilisateur user = getAuthUser(request);
        if (!(user instanceof Gestionnaire gestionnaire)) {
            throw new NotFoundException("Gestionnaire non trouvé.");
        }
        return gestionnaire;
    }

    private Etudiant findStudent(Long studentId) throws NotFoundException {
        Utilisateur user = utilisateurRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Étudiant introuvable "));
        if (!(user instanceof Etudiant etudiant)) {
            throw new NotFoundException("L'utilisateur spécifié n'est pas un étudiant.");
        }
        return etudiant;
    }

    private List<OffreDeStage> findAcceptedOffersForStudent(Long studentId) {
        return applicationStageRepository.findByEtudiantId(studentId).stream()
                .filter(app -> app.getStatutValidation() == StatutValidation.ACCEPTE)
                .map(ApplicationStage::getOffreDeStage)
                .toList();
    }

    private OffreDeStage requireAcceptedOffer(Long studentId, Long offerId) throws NotFoundException {
        return findAcceptedOffersForStudent(studentId).stream()
                .filter(offer -> offer.getId().equals(offerId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        "Cette offre n'est pas une offre acceptée pour cet étudiant."));
    }

    private Employeur findEmployerFromOffer(OffreDeStage offer) {
        Utilisateur owner = offer.getUtilisateur();
        if (owner == null) {
            return null;
        }
        Object real = org.hibernate.Hibernate.unproxy(owner);
        return real instanceof Employeur employer ? employer : null;
    }

    private Professeur findAssignedTeacher(Disciplines fieldOfStudy) {
        if (fieldOfStudy == null) {
            return null;
        }

        return utilisateurRepository.findProfesseursByDiscipline(fieldOfStudy)
                .stream()
                .findFirst()
                .orElse(null);
    }
}
