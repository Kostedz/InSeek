package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.dto.SessionDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class SessionService {

    public List<SessionDTO> listerToutesLesSessions() {
        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        String currentSessionCode;
        if (currentMonth <= 4) {
            currentSessionCode = "HIV_" + currentYear;
        } else if (currentMonth <= 8) {
            currentSessionCode = "ETE_" + currentYear;
        } else {
            currentSessionCode = "AUT_" + currentYear;
        }

        List<SessionDTO> sessions = new ArrayList<>();
        int startYear = 2024;
        int endYear = currentYear;

        String[] termCodes = {"HIV", "ETE", "AUT"};
        String[] termNames = {"Hiver", "Été", "Automne"};

        for (int yr = startYear; yr <= endYear; yr++) {
            for (int i = 0; i < termCodes.length; i++) {
                String id = termCodes[i] + "_" + yr;
                String name = termNames[i] + " " + yr;
                boolean isCurrent = id.equals(currentSessionCode);

                sessions.add(SessionDTO.builder()
                        .id(id)
                        .name(name)
                        .isCurrent(isCurrent)
                        .build());
            }
        }

        Collections.reverse(sessions);
        return sessions;
    }
}
