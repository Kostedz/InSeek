package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.model.Employeur;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.ModeEntrevue;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.EntrevueRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Profile("dev")
@RequiredArgsConstructor
public class DevDemoScenarioService {
    private static final String OFFER_FILE_PREFIX = "demo-offre-stage-";
    private static final String CV_RESOURCE = "demo/cv/camille-gagnon-cv.pdf";
    private static final int DEMO_APPLICATION_COUNT = 3;

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
    private final EntrevueRepository interviewRepository;
    private final UtilisateurRepository utilisateurRepository;

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
        prepareDemoInterviews(etudiant, employeur, offers);
    }

    private void prepareValidatedCv(Etudiant student) {
        byte[] cvData = readDemoPdf(CV_RESOURCE);
        CV cv = documentRepository.findByUtilisateur(student);
        if (cv == null) {
            cv = CV.builder()
                    .fileName("camille-gagnon-cv.pdf")
                    .targetDiscipline(student.getDiscipline())
                    .data(cvData)
                    .contentType("application/pdf")
                    .size(cvData.length)
                    .utilisateur(student)
                    .build();
        } else {
            cv.setFileName("camille-gagnon-cv.pdf");
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
                        .build();
            }

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
}
