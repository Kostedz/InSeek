package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.ContratStageGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * Provides a PDF for the browser-only student demo contract in the dev profile.
 */
@Profile("dev")
@RestController
@RequestMapping("/contracts/dev")
@RequiredArgsConstructor
public class DevContractController {

    private final ContratStageGenerator contratStageGenerator;

    @GetMapping(value = "/demo-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('ETUDIANT') or hasAuthority('EMPLOYEUR') or hasAuthority('GESTIONNAIRE')")
    public ResponseEntity<byte[]> getDemoContractPdf(
            @RequestParam(required = false) String studentSignedAt,
            @RequestParam(required = false) String employerSignedAt,
            @RequestParam(required = false) String managerSignedAt) throws IOException {
        ContratStageGenerator.ContratData data = new ContratStageGenerator.ContratData();
        data.referenceContrat = "DEMO-1";
        data.nomGestionnaire = "Marc-André Fortin";
        data.nomEmployeur = "Alexandre Bouchard";
        data.nomEtudiant = "Camille Gagnon";
        data.offreLieuStage = "Montréal, Québec";
        data.dateDebut = "2026-11-02";
        data.dateFin = "2027-02-01";
        data.schedule = "de 9h a 17h du Lundi au vendredi";
        data.nombreSemaines = ContratStageGenerator.weeksBetween(
                java.time.LocalDate.parse(data.dateDebut), java.time.LocalDate.parse(data.dateFin));
        data.heuresSemaine = "35 h";
        data.tauxHoraire = "22 $/h";
        data.offreDescription = "Stagiaire développeur logiciel. Travaillez sur des services backend, "
                + "des tests automatisés et des intégrations API avec une équipe de développement agile.";
        data.dateSignatureEtudiant = displayDate(studentSignedAt);
        data.dateSignatureEmployeur = displayDate(employerSignedAt);
        data.dateSignatureGestionnaire = displayDate(managerSignedAt);
        if (!data.dateSignatureEtudiant.isBlank()) {
            data.signatureEtudiant = "Signé électroniquement par Camille Gagnon";
        }
        if (!data.dateSignatureEmployeur.isBlank()) {
            data.signatureEmployeur = "Signé électroniquement par Alexandre Bouchard";
        }
        if (!data.dateSignatureGestionnaire.isBlank()) {
            data.signatureGestionnaire = "Signé électroniquement par Marc-André Fortin";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=contrat-stage-demo.pdf")
                .body(contratStageGenerator.generate(data));
    }

    private String displayDate(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.replace('T', ' ');
    }
}
