package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;

public record RegisterDTO(String nom, String prenom, String email, String role, String password, Disciplines discipline) {
}