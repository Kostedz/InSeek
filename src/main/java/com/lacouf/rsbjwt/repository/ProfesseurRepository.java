package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.utilisateur.Professeur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfesseurRepository extends JpaRepository<Professeur, Long> {
}