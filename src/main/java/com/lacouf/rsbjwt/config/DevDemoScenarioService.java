package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Contract;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.model.Employeur;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Gestionnaire;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.model.StatutContrat;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.model.StatutRechercheEtudiant;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.service.SseService;
import com.lacouf.rsbjwt.service.util.SessionUtil;
import com.lacouf.rsbjwt.service.util.NotificationType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevDemoScenarioService {
    private static final String OFFER_FILE_PREFIX = "demo-offre-stage-";
    private static final String CV_RESOURCE = "demo/cv/camille-gagnon-cv.pdf";
    private static final String SECOND_STUDENT_CV_RESOURCE = "demo/cv/Pascal_Carbonneau_CV_2026.pdf";
    private static final int DEMO_APPLICATION_COUNT = 3;
    private static final long DELAYED_NOTIFICATIONS_DELAY_SECONDS = 5;

    private record DemoOffer(
            Disciplines discipline,
            String position,
            String description,
            String address,
            double salary
    ) {
    }

    private static final List<DemoOffer> DEMO_OFFERS = List.of(
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire développeur web",
                    "Participez au développement de fonctionnalités web avec Java, Spring Boot et React, au sein d'une équipe produit qui vous accompagnera pendant toute la durée du stage.",
                    "Montréal, Québec",
                    21.50
            ),
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire développeur logiciel",
                    "Travaillez sur des services backend, des tests automatisés et des intégrations API avec une équipe de développement agile.",
                    "Montréal, Québec",
                    22.00
            ),
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire assurance qualité",
                    "Préparez des scénarios de test, analysez les résultats et collaborez avec les développeurs pour améliorer la qualité du produit.",
                    "Montréal, Québec",
                    20.75
            ),
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire analyste de données",
                    "Nettoyez des jeux de données, construisez des tableaux de bord et présentez des constats utiles aux équipes produit et opérations.",
                    "Montréal, Québec",
                    21.25
            ),
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire en cybersécurité",
                    "Participez à la revue des alertes, à la documentation des contrôles et à l'amélioration des pratiques de sécurité de l'organisation.",
                    "Montréal, Québec",
                    22.50
            ),
            new DemoOffer(
                    Disciplines.INFORMATIQUE,
                    "Stagiaire support TI",
                    "Répondez aux demandes des utilisateurs, documentez les solutions et contribuez à l'amélioration de l'expérience technologique interne.",
                    "Montréal, Québec",
                    20.00
            ),
            new DemoOffer(
                    Disciplines.INFIRMIERE,
                    "Stagiaire en soins infirmiers",
                    "Accompagnez l'équipe clinique dans un environnement d'apprentissage encadré auprès d'une clientèle diversifiée.",
                    "Laval, Québec",
                    20.00
            ),
            new DemoOffer(
                    Disciplines.ARCHITECTURE,
                    "Stagiaire en architecture",
                    "Contribuez à la préparation de plans, de maquettes et de dossiers de présentation pour des projets résidentiels et commerciaux.",
                    "Montréal, Québec",
                    19.50
            ),
            new DemoOffer(
                    Disciplines.ADMINISTRATION,
                    "Stagiaire en administration",
                    "Soutenez les opérations quotidiennes, la préparation de rapports et la coordination des activités administratives.",
                    "Longueuil, Québec",
                    18.75
            ),
            new DemoOffer(
                    Disciplines.COMPTABILITE,
                    "Stagiaire en comptabilité",
                    "Aidez à la préparation des rapprochements bancaires, au suivi des factures et à la production de rapports financiers.",
                    "Brossard, Québec",
                    20.25
            ),
            new DemoOffer(
                    Disciplines.EDUCATION,
                    "Stagiaire en éducation",
                    "Participez à la préparation d'activités pédagogiques et accompagnez les élèves avec une équipe-école expérimentée.",
                    "Terrebonne, Québec",
                    19.00
            ),
            new DemoOffer(
                    Disciplines.GENIE_CIVIL,
                    "Stagiaire en génie civil",
                    "Appuyez les chargés de projet dans le suivi de chantier, la lecture de plans et la préparation de rapports techniques.",
                    "Repentigny, Québec",
                    23.00
            ),
            new DemoOffer(
                    Disciplines.MARKETING,
                    "Stagiaire en marketing numérique",
                    "Contribuez à la création de contenu, à l'analyse des campagnes et à l'amélioration de la présence numérique de l'entreprise.",
                    "Montréal, Québec",
                    19.75
            ),
            new DemoOffer(
                    Disciplines.DESIGN_GRAPHIQUE,
                    "Stagiaire en design graphique",
                    "Concevez des visuels pour les communications numériques et imprimées en collaboration avec l'équipe marketing.",
                    "Montréal, Québec",
                    19.25
            )
    );

    private final DocumentRepository documentRepository;
    private final ApplicationStageRepository applicationStageRepository;
    private final ContratRepository contratRepository;
    private final EntrevueRepository interviewRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TaskScheduler taskScheduler;
    private final TransactionTemplate transactionTemplate;
    private final SseService sseService;

    @Transactional
    public void prepareStudentScenario() {
        Utilisateur student = utilisateurRepository.findByEmail(DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.ETUDIANT).email());
        Utilisateur employer = utilisateurRepository.findByEmail(DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.EMPLOYEUR).email());

        if (!(student instanceof Etudiant etudiant)) {
            throw new IllegalStateException("Le compte étudiant de démonstration est introuvable.");
        }
        if (!(employer instanceof Employeur employeur)) {
            throw new IllegalStateException("Le compte employeur de démonstration est introuvable.");
        }

        prepareValidatedCv(etudiant);
        List<OffreDeStage> offers = prepareValidatedOffers(employeur);
        prepareDemoApplications(etudiant, offers);
        prepareAcceptedStudentWithoutContract(etudiant, offers);
        prepareDemoInterviews(etudiant, employeur, offers);
    }

    @Transactional
    public void prepareSignedContractStudentScenario() {
        prepareStudentScenario();

        Utilisateur sourceUser = utilisateurRepository.findByEmail(DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.ETUDIANT).email());
        Utilisateur employerUser = utilisateurRepository.findByEmail(DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.EMPLOYEUR).email());
        Utilisateur targetUser = utilisateurRepository.findByEmail(DevDemoAccounts.signedContractStudent().email());
        if (!(sourceUser instanceof Etudiant source) || !(employerUser instanceof Employeur employer)
                || !(targetUser instanceof Etudiant target)) {
            throw new IllegalStateException("Les comptes de démonstration pour le contrat signé sont introuvables.");
        }

        List<ApplicationStage> sourceApplications = applicationStageRepository.findByEtudiantId(source.getId());
        ApplicationStage accepted = sourceApplications.stream()
                .filter(application -> application.getStatutValidation() == StatutValidation.ACCEPTE)
                .findFirst().orElseThrow(() -> new IllegalStateException("La demande de stage acceptée de démonstration est introuvable."));
        OffreDeStage acceptedOffer = accepted.getOffreDeStage();

        Utilisateur professorUser = utilisateurRepository.findByEmail(DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.PROFESSEUR).email());
        Utilisateur managerUser = utilisateurRepository.findByEmail(
                DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.GESTIONNAIRE).email());
        if (!(professorUser instanceof Professeur professor) || !(managerUser instanceof Gestionnaire manager)) {
            throw new IllegalStateException("Les comptes professeur ou gestionnaire nécessaires sont introuvables.");
        }
        target.setDiscipline(source.getDiscipline());
        target.setStatutRecherche(StatutRechercheEtudiant.SIGNED_CONTRACT);
        target.setProfesseur(professor);
        utilisateurRepository.save(target);

        CV sourceCv = documentRepository.findByUtilisateur(source);
        if (sourceCv != null) {
            CV targetCv = documentRepository.findByUtilisateur(target);
            if (targetCv == null) {
                targetCv = CV.builder().fileName(sourceCv.getFileName()).targetDiscipline(sourceCv.getTargetDiscipline())
                        .data(sourceCv.getData()).contentType(sourceCv.getContentType()).size(sourceCv.getSize())
                        .utilisateur(target).build();
            } else {
                targetCv.setFileName(sourceCv.getFileName());
                targetCv.setTargetDiscipline(sourceCv.getTargetDiscipline());
                targetCv.setData(sourceCv.getData());
                targetCv.setContentType(sourceCv.getContentType());
                targetCv.setSize(sourceCv.getSize());
            }
            targetCv.setStatut(sourceCv.getStatut());
            targetCv.setCommentaireRejet(sourceCv.getCommentaireRejet());
            documentRepository.save(targetCv);
        }

        for (ApplicationStage sourceApplication : sourceApplications) {
            ApplicationStage copy = applicationStageRepository
                    .findByEtudiantIdAndOffreDeStageId(target.getId(), sourceApplication.getOffreDeStage().getId())
                    .orElseGet(ApplicationStage::new);
            copy.setEtudiant(target);
            copy.setOffreDeStage(sourceApplication.getOffreDeStage());
            copy.setStatutValidation(sourceApplication.getStatutValidation());
            copy.setDateApplique(sourceApplication.getDateApplique());
            copy.setDateDecision(sourceApplication.getDateDecision());
            copy.setCommentaireRefus(sourceApplication.getCommentaireRefus());
            applicationStageRepository.save(copy);
        }

        LocalDateTime now = LocalDateTime.now().withNano(0);
        Contract contract = contratRepository.findByStudentIdAndInternshipOfferId(target.getId(), acceptedOffer.getId())
                .orElseGet(Contract::new);
        contract.setStudent(target);
        contract.setEmployer(employer);
        contract.setInternshipOffer(acceptedOffer);
        contract.setAdmin(manager);
        contract.setTeacher(professor);
        contract.setSupervisorName(acceptedOffer.getContactName() == null ? "Julien Roy" : acceptedOffer.getContactName());
        contract.setStartingDate(LocalDate.now().minusDays(7));
        contract.setEndingDate(LocalDate.now().plusMonths(3));
        contract.setSchedule("Du lundi au vendredi, de 9 h à 17 h");
        contract.setWeeklyHours(35);
        contract.setHourlySalary(acceptedOffer.getSalaire());
        contract.setInternshipLocation(acceptedOffer.getAdresseEntreprise());
        contract.setContractStatus(StatutContrat.EXECUTED);
        contract.setDateCreation(now.minusDays(5));
        contract.setStudentSignedAt(now.minusDays(4));
        contract.setEmployerSignedAt(now.minusDays(3));
        contract.setManagerSignedAt(now.minusDays(2));
        contratRepository.save(contract);
    }

    private void prepareValidatedCv(Etudiant student) {
        prepareValidatedCv(student, CV_RESOURCE, "camille-gagnon-cv.pdf");
    }

    private void prepareValidatedCv(Etudiant student, String cvResource, String fileName) {
        byte[] cvData = readDemoPdf(cvResource);
        CV cv = documentRepository.findByUtilisateur(student);
        if (cv == null) {
            cv = CV.builder()
                    .fileName(fileName)
                    .targetDiscipline(student.getDiscipline())
                    .data(cvData)
                    .contentType("application/pdf")
                    .size(cvData.length)
                    .utilisateur(student)
                    .build();
        } else {
            cv.setFileName(fileName);
            cv.setTargetDiscipline(student.getDiscipline());
            cv.setData(cvData);
            cv.setContentType("application/pdf");
            cv.setSize(cvData.length);
        }
        cv.setStatut(StatutValidation.VALIDE);
        cv.setCommentaireRejet(null);
        documentRepository.save(cv);
    }

    private List<OffreDeStage> prepareValidatedOffers(Employeur employer) {
        List<OffreDeStage> existingOffers = documentRepository.findOffersByEmployer(employer);
        List<OffreDeStage> preparedOffers = new ArrayList<>();
        LocalDate firstStartDate = LocalDate.now().plusDays(7);

        for (int index = 0; index < DEMO_OFFERS.size(); index++) {
            String fileName = OFFER_FILE_PREFIX + String.format("%02d.pdf", index + 1);
            byte[] offerPdf = readDemoPdf("demo/offres/" + fileName);
            DemoOffer demoOffer = DEMO_OFFERS.get(index);
            LocalDate startDate = firstStartDate.plusDays(index * 3L);
            OffreDeStage offer = existingOffers.stream()
                    .filter(existing -> fileName.equals(existing.getFileName()))
                    .findFirst()
                    .orElse(null);
            if (offer == null) {
                offer = OffreDeStage.builder()
                        .fileName(fileName)
                        .data(offerPdf)
                        .contentType("application/pdf")
                        .size(offerPdf.length)
                        .employeur(employer)
                        .session(SessionUtil.getCurrentSession())
                        .build();
            }
            offer.setUtilisateur(employer);
            offer.setEmployeur(employer);
            offer.setTargetDiscipline(demoOffer.discipline());
            offer.setNomEntreprise(employer.getNomCompagnie());
            offer.setPosition(demoOffer.position());
            offer.setDescriptionPosition(demoOffer.description());
            offer.setDateDebutStage(startDate);
            offer.setDateFinStage(startDate.plusMonths(3));
            offer.setAdresseEntreprise(demoOffer.address());
            offer.setSalaire(demoOffer.salary());
            offer.setContactName("Julien Roy");
            offer.setContactPhone("+1 514 555-0187");
            offer.setStatut(StatutValidation.VALIDE);
            offer.setCommentaireRejet(null);
            offer.setData(offerPdf);
            offer.setContentType("application/pdf");
            offer.setSize(offerPdf.length);
            offer.setUpdatedAt(LocalDateTime.now());
            preparedOffers.add(documentRepository.save(offer));
        }

        return preparedOffers;
    }

    private byte[] readDemoPdf(String resourcePath) {
        try (InputStream resource = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (resource == null) {
                throw new IllegalStateException("PDF de démonstration introuvable: " + resourcePath);
            }
            return resource.readAllBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Impossible de lire le PDF de démonstration: " + resourcePath, exception);
        }
    }

    private void prepareDemoApplications(Etudiant student, List<OffreDeStage> offers) {
        applicationStageRepository.findByEtudiantId(student.getId()).stream()
                .filter(application -> application.getOffreDeStage() == null
                        || application.getOffreDeStage().getTargetDiscipline() != student.getDiscipline())
                .forEach(applicationStageRepository::delete);

        List<OffreDeStage> demoApplicationOffers = offers.stream()
                .filter(offer -> offer.getTargetDiscipline() == student.getDiscipline())
                .limit(DEMO_APPLICATION_COUNT)
                .toList();

        for (int index = 0; index < demoApplicationOffers.size(); index++) {
            OffreDeStage offer = demoApplicationOffers.get(index);
            ApplicationStage application = applicationStageRepository
                    .findByEtudiantIdAndOffreDeStageId(student.getId(), offer.getId())
                    .orElseGet(ApplicationStage::new);

            application.setEtudiant(student);
            application.setOffreDeStage(offer);

            if (index == 1) {
                application.setStatutValidation(StatutValidation.ACCEPTE);
                application.setCommentaireRefus(null);
                application.setDateDecision(LocalDateTime.now().minusDays(7));
            } else if (index == 2) {
                application.setStatutValidation(StatutValidation.REJETE);
                application.setCommentaireRefus("Le profil ne correspond pas entièrement aux besoins actuels.");
                application.setDateDecision(LocalDateTime.now().minusDays(5));
            } else {
                application.setStatutValidation(StatutValidation.EN_ATTENTE);
                application.setCommentaireRefus(null);
                application.setDateDecision(null);
            }

            applicationStageRepository.save(application);
        }

        student.setStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND);
        utilisateurRepository.save(student);
    }

    private void prepareAcceptedStudentWithoutContract(Etudiant student, List<OffreDeStage> offers) {
        OffreDeStage offer = offers.stream()
                .filter(candidate -> candidate.getTargetDiscipline() == student.getDiscipline())
                .skip(1)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("L'offre démo acceptée est introuvable."));

        ApplicationStage acceptedApplication = applicationStageRepository
                .findByEtudiantIdAndOffreDeStageId(student.getId(), offer.getId())
                .orElseThrow(() -> new IllegalStateException("La candidature démo acceptée est introuvable."));

        if (acceptedApplication.getStatutValidation() != StatutValidation.ACCEPTE) {
            throw new IllegalStateException("La candidature démo doit être acceptée.");
        }

        contratRepository.findByStudentIdAndInternshipOfferId(student.getId(), offer.getId())
                .ifPresent(contratRepository::delete);
    }

    private void prepareDemoInterviews(Etudiant student, Employeur employer, List<OffreDeStage> offers) {
        List<OffreDeStage> studentOffers = offers.stream()
                .filter(offer -> offer.getTargetDiscipline() == student.getDiscipline())
                .toList();

        if (studentOffers.isEmpty()) return;

        OffreDeStage pendingOffer = studentOffers.get(0);
        Entrevue pendingInterview = interviewRepository
                .findByStudentIdAndInternshipOfferId(student.getId(), pendingOffer.getId())
                .orElseGet(Entrevue::new);
        pendingInterview.setStudent(student);
        pendingInterview.setEmployer(employer);
        pendingInterview.setInternshipOffer(pendingOffer);
        pendingInterview.setDateInterview(LocalDateTime.now()
                .plusDays(4)
                .withHour(10)
                .withMinute(30)
                .withSecond(0)
                .withNano(0));
        pendingInterview.setModeInterview(ModeEntrevue.VIDEO_CALL);
        pendingInterview.setLocationOrLink("https://meet.google.com/demo-inseek");
        pendingInterview.setMessage("Nous avons hâte de discuter de votre expérience et du stage avec vous.");
        pendingInterview.setInterviewInvitationStatus(StatutConvocationEntrevue.PENDING);
        pendingInterview.setInvitationResponseDate(null);
        pendingInterview.setMessageWhenRejected(null);
        interviewRepository.save(pendingInterview);

        if (studentOffers.size() < 2) return;

        OffreDeStage acceptedOffer = studentOffers.get(1);
        Entrevue acceptedInterview = interviewRepository
                .findByStudentIdAndInternshipOfferId(student.getId(), acceptedOffer.getId())
                .orElseGet(Entrevue::new);
        acceptedInterview.setStudent(student);
        acceptedInterview.setEmployer(employer);
        acceptedInterview.setInternshipOffer(acceptedOffer);
        acceptedInterview.setDateInterview(LocalDateTime.now()
                .minusDays(8)
                .withHour(14)
                .withMinute(0)
                .withSecond(0)
                .withNano(0));
        acceptedInterview.setModeInterview(ModeEntrevue.IN_PERSON);
        acceptedInterview.setLocationOrLink("Bureau 304, 7250 rue du Mile End, Montréal");
        acceptedInterview.setMessage("Merci pour votre disponibilité. Au plaisir de vous rencontrer.");
        acceptedInterview.setInterviewInvitationStatus(StatutConvocationEntrevue.ACCEPTED);
        acceptedInterview.setInvitationResponseDate(LocalDateTime.now().minusDays(10));
        acceptedInterview.setMessageWhenRejected(null);
        interviewRepository.save(acceptedInterview);

        student.setDateInterview(pendingInterview.getDateInterview());
        utilisateurRepository.save(student);
    }

    @Transactional
    public void prepareDelayedNotificationsScenario() {
        taskScheduler.schedule(() -> {
            try {
                transactionTemplate.executeWithoutResult(status -> {
                    prepareSignedContractStudentScenario();
                    preparePendingNotificationsData();
                });
                String email = DevDemoAccounts.forRole(Role.GESTIONNAIRE).email();
                Utilisateur recipient = utilisateurRepository.findByEmail(email);
                sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);
                sseService.sendNotification(NotificationType.CV_TO_APPROVE, recipient);
            } catch (RuntimeException exception) {
                log.error("Impossible de préparer le scénario de notifications différées.", exception);
            }
        }, Instant.now().plusSeconds(DELAYED_NOTIFICATIONS_DELAY_SECONDS));
    }

    private void preparePendingNotificationsData() {
        Utilisateur employerUser = utilisateurRepository.findByEmail(
                DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.EMPLOYEUR).email());
        Utilisateur studentUser = utilisateurRepository.findByEmail(
                DevDemoAccounts.forRole(com.lacouf.rsbjwt.model.auth.Role.ETUDIANT).email());

        if (!(employerUser instanceof Employeur employer) || !(studentUser instanceof Etudiant student)) {
            throw new IllegalStateException("Les comptes de démonstration pour les notifications sont introuvables.");
        }

        List<OffreDeStage> offers = documentRepository.findOffersByEmployer(employer);
        int pendingOfferCount = (offers.size() + 1) / 2;
        offers.stream()
                .limit(pendingOfferCount)
                .forEach(offer -> {
                    offer.setStatut(StatutValidation.EN_ATTENTE);
                    offer.setCommentaireRejet(null);
                    documentRepository.save(offer);
                });

        CV studentCv = documentRepository.findByUtilisateur(student);
        if (studentCv == null) {
            throw new IllegalStateException("Le CV de démonstration est introuvable.");
        }
        studentCv.setStatut(StatutValidation.EN_ATTENTE);
        studentCv.setCommentaireRejet(null);
        documentRepository.save(studentCv);

        Utilisateur secondStudentUser = utilisateurRepository.findByEmail(DevDemoAccounts.secondStudent().email());
        if (!(secondStudentUser instanceof Etudiant secondStudent)) {
            throw new IllegalStateException("Le deuxième compte étudiant de démonstration est introuvable.");
        }
        prepareValidatedCv(secondStudent, SECOND_STUDENT_CV_RESOURCE, "Pascal_Carbonneau_CV_2026.pdf");
        CV secondStudentCv = documentRepository.findByUtilisateur(secondStudent);
        if (secondStudentCv == null) {
            throw new IllegalStateException("Le CV du deuxième étudiant de démonstration est introuvable.");
        }
        secondStudentCv.setStatut(StatutValidation.EN_ATTENTE);
        secondStudentCv.setCommentaireRejet(null);
        documentRepository.save(secondStudentCv);
    }
}
