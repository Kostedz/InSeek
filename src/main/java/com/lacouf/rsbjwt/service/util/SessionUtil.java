package com.lacouf.rsbjwt.service.util;

import java.time.LocalDate;

public class SessionUtil {

    public static String getCurrentSession() {
        LocalDate today = LocalDate.now();
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
