package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.entrevue.Entrevue;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.function.IntFunction;

/**
 * Événement générique de notification. Pour ajouter un nouveau type :
 * créer une fabrique statique ici, puis publier avec eventPublisher.publishEvent(...).
 *
 * @param cumulatif true = une notification non lue existante pour le même lien incrémente son compteur
 *                  (ex. candidatures); false = elle est simplement mise à jour (ex. convocations).
 * @param message   construit le texte à partir du compteur courant.
 * @param messageEn version anglaise du texte (par défaut identique à message).
 */
public record NotificationEvent(
        Utilisateur destinataire,
        String titre,
        String lienDirect,
        boolean cumulatif,
        IntFunction<String> message,
        IntFunction<String> messageEn) {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH:mm", Locale.CANADA_FRENCH);

    private static final DateTimeFormatter DATE_FORMAT_EN =
            DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' h:mm a", Locale.CANADA);

    public NotificationEvent(Utilisateur destinataire, String titre, String lienDirect,
                             boolean cumulatif, IntFunction<String> message) {
        this(destinataire, titre, lienDirect, cumulatif, message, message);
    }

    public static NotificationEvent candidature(ApplicationStage app) {
        OffreDeStage offre = app.getOffreDeStage();
        String poste = offre.getPosition();
        return new NotificationEvent(
                offre.getUtilisateur(),
                "Nouvelle candidature !",
                "/employeur/offre/" + offre.getId(),
                true,
                n -> n + (n > 1 ? " nouveaux candidats" : " nouveau candidat") + " pour le poste de " + poste);
    }

    public static NotificationEvent convocation(Entrevue e, boolean modifiee) {
        String titre = modifiee ? "Convocation modifiée" : "Nouvelle convocation";
        // ⚠ À adapter : champ du nom de l'employeur/entreprise
        String texte = titre + " de " + e.getEmployer().getNomCompagnie()
                + " pour le poste de " + e.getInternshipOffer().getPosition()
                + " le " + e.getDateInterview().format(DATE_FORMAT);
        return new NotificationEvent(
                e.getStudent(),
                titre,
                "/etudiant/convocations/" + e.getId(),
                false,
                n -> texte);
    }

    public static NotificationEvent contrat(Contract contrat, Utilisateur destinataire,
                                            String lienDirect, boolean modifie) {
        String titre = modifie ? "Contrat de stage modifié" : "Nouveau contrat de stage";
        String poste = contrat.getInternshipOffer().getPosition();
        String entreprise = contrat.getEmployer().getNomCompagnie();
        String texte = titre + " pour le poste de " + poste + " chez " + entreprise + ".";
        return new NotificationEvent(
                destinataire,
                titre,
                lienDirect,
                false,
                n -> texte);
    }

    public static NotificationEvent evaluationStage(Contract contrat) {
        String studentName = (contrat.getStudent().getPrenom() + " " + contrat.getStudent().getNom()).trim();
        String poste = contrat.getInternshipOffer().getPosition();
        String titre = "Évaluation de stage à remplir";
        String texte = "Veuillez remplir l’évaluation de stage de " + studentName
                + " pour le poste de " + poste + ".";
        return new NotificationEvent(
                contrat.getEmployer(),
                titre,
                "/employeur/evaluations?contract=" + contrat.getId(),
                false,
                n -> texte);
    }

    public static NotificationEvent cv(Etudiant etudiant, boolean corrige, Utilisateur gestionnaire) {
        String nom = (etudiant.getPrenom() + " " + etudiant.getNom()).trim();
        String discipline = libelleDiscipline(etudiant);
        String identite = discipline.isBlank() ? nom : nom + " (" + discipline + ")";
        LocalDateTime depot = LocalDateTime.now();

        String titre = corrige ? "CV corrigé à valider" : "Nouveau CV à valider";
        String texteFr = (corrige ? "Version corrigée du CV de " : "Nouveau CV de ")
                + identite + ", déposé le " + depot.format(DATE_FORMAT) + ".";
        String texteEn = (corrige ? "Corrected résumé version from " : "New résumé from ")
                + identite + ", submitted on " + depot.format(DATE_FORMAT_EN) + ".";

        return new NotificationEvent(
                gestionnaire,
                titre,
                "/gestionnaire/cv?etudiant=" + etudiant.getId(),
                false,
                n -> texteFr,
                n -> texteEn);
    }

    public static NotificationEvent cvStatus(Utilisateur etudiant, boolean approuve, String commentaire) {
        String titre = approuve ? "CV accepté" : "CV refusé";
        String texteFr = approuve
                ? "Votre CV a été accepté."
                : "Votre CV a été refusé." + (commentaire == null || commentaire.isBlank()
                        ? "" : " Motif : " + commentaire);
        String texteEn = approuve
                ? "Your résumé was accepted."
                : "Your résumé was rejected." + (commentaire == null || commentaire.isBlank()
                        ? "" : " Reason: " + commentaire);

        return new NotificationEvent(
                etudiant,
                titre,
                "/etudiant",
                false,
                n -> texteFr,
                n -> texteEn);
    }

    public static NotificationEvent nouvelleEvaluationStage(Contract contrat) {
        String studentName = (contrat.getStudent().getPrenom() + " " + contrat.getStudent().getNom()).trim();
        String poste = contrat.getInternshipOffer().getPosition();
        String titre = "Nouvelle évaluation de stage";
        String texte = "L’employeur a soumis l’évaluation de stage de " + studentName
                + " pour le poste de " + poste + ".";
        return new NotificationEvent(
                contrat.getTeacher(),
                titre,
                "/professeur/evaluations?contract=" + contrat.getId(),
                false,
                n -> texte);
    }

    private static String libelleDiscipline(Etudiant etudiant) {
        if (etudiant.getDiscipline() == null) return "";
        String brut = etudiant.getDiscipline().name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(brut.charAt(0)) + brut.substring(1);
    }
}