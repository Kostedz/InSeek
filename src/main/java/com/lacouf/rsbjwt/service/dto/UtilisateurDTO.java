package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Utilisateur;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public interface UtilisateurDTO {
    String nom();
    String prenom();
    String email();
    String role();
}
