package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.entrevue.Entrevue;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Utilisateur;

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
 */
public record NotificationEvent(
        Utilisateur destinataire,
        String titre,
        String lienDirect,
        boolean cumulatif,
        IntFunction<String> message) {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH:mm", Locale.CANADA_FRENCH);

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
}
