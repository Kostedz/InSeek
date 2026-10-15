package com.lacouf.rsbjwt.config;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Employeur;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutValidation;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Profile("dev")
@RequiredArgsConstructor
public class DevDemoScenarioService {
    private static final int OFFER_COUNT = 9;
    private static final String OFFER_FILE_PREFIX = "demo-offre-stage-";
    private static final byte[] DEMO_PDF = """
            %PDF-1.4
            1 0 obj
            << /Type /Catalog /Pages 2 0 R >>
            endobj
            2 0 obj
            << /Type /Pages /Kids [3 0 R] /Count 1 >>
            endobj
            3 0 obj
            << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
            endobj
            4 0 obj
            << /Length 0 >>
            stream
            
            endstream
            endobj
            trailer
            << /Root 1 0 R >>
            %%EOF
            """.getBytes(StandardCharsets.US_ASCII);

    private final DocumentRepository documentRepository;
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
        prepareValidatedOffers(employeur);
    }

    private void prepareValidatedCv(Etudiant student) {
        CV cv = documentRepository.findByUtilisateur(student);
        if (cv == null) {
            cv = CV.builder()
                    .fileName("demo-cv-verifie.pdf")
                    .targetDiscipline(student.getDiscipline())
                    .data(DEMO_PDF.clone())
                    .contentType("application/pdf")
                    .size(DEMO_PDF.length)
                    .utilisateur(student)
                    .build();
        } else {
            cv.setFileName("demo-cv-verifie.pdf");
            cv.setTargetDiscipline(student.getDiscipline());
            cv.setData(DEMO_PDF.clone());
            cv.setContentType("application/pdf");
            cv.setSize(DEMO_PDF.length);
        }
        cv.setStatut(StatutValidation.VALIDE);
        cv.setCommentaireRejet(null);
        documentRepository.save(cv);
    }

    private void prepareValidatedOffers(Employeur employer) {
        List<OffreDeStage> existingOffers = documentRepository.findOffersByEmployer(employer);
        List<Disciplines> disciplines = Arrays.asList(Disciplines.values());
        LocalDate firstStartDate = LocalDate.now().plusDays(7);

        for (int index = 0; index < OFFER_COUNT; index++) {
            String fileName = OFFER_FILE_PREFIX + String.format("%02d.pdf", index + 1);
            Disciplines discipline = disciplines.get(index % disciplines.size());
            LocalDate startDate = firstStartDate.plusDays(index * 3L);
            OffreDeStage offer = existingOffers.stream()
                    .filter(existing -> fileName.equals(existing.getFileName()))
                    .findFirst()
                    .orElse(null);
            if (offer == null) {
                offer = OffreDeStage.builder()
                        .fileName(fileName)
                        .targetDiscipline(discipline)
                        .data(DEMO_PDF.clone())
                        .contentType("application/pdf")
                        .size(DEMO_PDF.length)
                        .employeur(employer)
                        .nomEntreprise(employer.getNomCompagnie())
                        .position("Stage en " + discipline.string.toLowerCase())
                        .descriptionPosition("Participez à des projets concrets avec une équipe qui vous accompagnera pendant toute la durée du stage.")
                        .dateDebutStage(startDate)
                        .dateFinStage(startDate.plusMonths(3))
                        .adresseEntreprise("Montréal, Québec")
                        .salaire(18.0 + index)
                        .contactName("Équipe InSeek")
                        .contactPhone("+1 514 555-0100")
                        .build();
            }

            offer.setStatut(StatutValidation.VALIDE);
            offer.setCommentaireRejet(null);
            offer.setData(DEMO_PDF.clone());
            offer.setContentType("application/pdf");
            offer.setSize(DEMO_PDF.length);
            offer.setUpdatedAt(LocalDateTime.now());
            documentRepository.save(offer);
        }
    }
}
