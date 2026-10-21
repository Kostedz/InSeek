package com.lacouf.rsbjwt.service.dto;

public record EmployeurDTO(Long id, String nom, String prenom, String email, String role, String nomCompagnie) implements UtilisateurDTO  {
    public static EmployeurDTO of(com.lacouf.rsbjwt.model.Employeur employeur) {
        return new EmployeurDTO(employeur.getId(), employeur.getNom(), employeur.getPrenom(), employeur.getEmail(), employeur.getRole(), employeur.getNomCompagnie());
    }
}
