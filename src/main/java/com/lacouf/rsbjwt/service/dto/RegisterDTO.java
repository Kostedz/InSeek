package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.auth.Role;

public record RegisterDTO(String nom, String prenom, String email, Role role, String password, String confirmedPassword, Disciplines discipline) {
}