package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
}
