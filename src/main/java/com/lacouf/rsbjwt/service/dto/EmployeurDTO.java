package com.lacouf.rsbjwt.service.dto;

public record EmployeurDTO(Long id, String nom, String prenom, String email, String role, String nomCompagnie) implements UtilisateurDTO  {
    public static EmployeurDTO of(com.lacouf.rsbjwt.model.Employeur etudiant) {
        return new EmployeurDTO(etudiant.getId(), etudiant.getNom(), etudiant.getPrenom(), etudiant.getEmail(), etudiant.getRole(), etudiant.getNomCompagnie());
    }
}
