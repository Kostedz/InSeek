package com.lacouf.rsbjwt.service.util;

import com.lacouf.rsbjwt.exception.BadRequestException;
import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public abstract class Fields {

    protected static String requiredString(JsonNode result, String field)
            throws BadRequestException {
        String value = optionalString(result, field);

        if (value == null || value.isBlank()) {
            throw new BadRequestException(
                    "Field '" + field + "' is required"
            );
        }

        return value.trim();
    }

    protected static String optionalString(JsonNode result, String field) {
        JsonNode node = result.get(field);
        return node == null || node.isNull() ? null : node.asString();
    }

    protected static Double optionalDouble(JsonNode result, String field) {
        JsonNode node = result.get(field);

        return node == null || node.isNull() || node.asString().isBlank()
                ? null
                : node.asDouble();
    }

    protected static LocalDate parseDate(JsonNode result, String field)
            throws BadRequestException {
        String value = requiredString(result, field);

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException(
                    "Invalid date for field '" + field + "'"
            );
        }
    }
}
