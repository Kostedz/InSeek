package com.lacouf.rsbjwt.service.util;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.model.Disciplines;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.util.Locale;

@Getter
@AllArgsConstructor
public class OfferFields extends Fields {
    private final String nomEntreprise;
    private final String position;
    private final String descriptionPosition;
    private final LocalDate dateDebutStage;
    private final LocalDate dateFinStage;
    private final String adresseEntreprise;
    private final Double salaire;
    private final String contactName;
    private final String contactPhone;
    private final Disciplines targetDiscipline;


    public Disciplines getDiscipline() {
        return targetDiscipline;
    }

    public static OfferFields from(JsonNode result)
            throws BadRequestException {

        if (result == null
                || !"OffreDeStage".equals(requiredString(result, "type"))) {
            throw new BadRequestException("Invalid document type");
        }

        LocalDate startDate = parseDate(result, "dateDebutStage");
        LocalDate endDate = parseDate(result, "dateFinStage");

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException(
                    "La date de fin doit suivre la date de début"
            );
        }

        Disciplines discipline;
        try {
            discipline = Disciplines.valueOf(
                    requiredString(result, "targetDiscipline")
                            .toUpperCase(Locale.ROOT)
            );
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
    }
}

