package com.lacouf.rsbjwt.service.util;

import java.time.LocalDate;

public class SessionUtil {

    public static String getCurrentSession() {
        return getSession(LocalDate.now());
    }

    public static String getNextSession(LocalDate today) {
        String currentSession = getSession(today);
        char season = currentSession.charAt(0);
        int year = Integer.parseInt(currentSession.substring(1));

        return switch (season) {
            case 'H' -> "E" + String.format("%02d", year);
            case 'E' -> "A" + String.format("%02d", year);
            case 'A' -> "H" + String.format("%02d", (year + 1) % 100);
            default -> throw new IllegalStateException("Session inconnue: " + currentSession);
        };
    }

    public static String getSession(LocalDate today) {
        int year = today.getYear();

        String formattedYear = String.format("%02d", year % 100);

        if (today.isBefore(LocalDate.of(year, 5, 1))) {
            return "H" + formattedYear;
        }

        if (today.isBefore(LocalDate.of(year, 9, 1))) {
            return "E" + formattedYear;
        }

        if (today.isBefore(LocalDate.of(year, 12, 15))) {
            return "A" + formattedYear;
        }

        return "H" + String.format("%02d", (year + 1) % 100);
    }
}
