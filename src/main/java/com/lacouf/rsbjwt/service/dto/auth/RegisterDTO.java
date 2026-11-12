    package com.lacouf.rsbjwt.service.dto.auth;

    import com.lacouf.rsbjwt.model.auth.Role;

    public record RegisterDTO(String nom, String prenom, String email, Role role, String password, String affiliation) {
    }