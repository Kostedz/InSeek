package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.utilisateur.Disciplines;

public interface DocumentDTO {
    String email();
    Disciplines targetDiscipline();
}
