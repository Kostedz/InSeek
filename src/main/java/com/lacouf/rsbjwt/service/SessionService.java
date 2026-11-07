package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.service.dto.SessionDTO;
import com.lacouf.rsbjwt.service.util.SessionUtil;
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
        String currentSessionCode = SessionUtil.getSession(now);

        List<SessionDTO> sessions = new ArrayList<>();
        int startYear = 2024;
        int endYear = currentYear + (now.getMonthValue() == 12 && now.getDayOfMonth() >= 15 ? 1 : 0);

        String[] termCodes = {"H", "E", "A"};
        String[] termNames = {"Hiver", "Été", "Automne"};

        for (int yr = startYear; yr <= endYear; yr++) {
            for (int i = 0; i < termCodes.length; i++) {
                String id = termCodes[i] + String.format("%02d", yr % 100);
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
