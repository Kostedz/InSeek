package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Professeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProfesseurRepository extends JpaRepository<Professeur, Long> {
    @Query("SELECT teacher FROM Professeur teacher WHERE teacher.credentials.email = :email")
    Optional<Professeur> findByEmail(@Param("email") String email);
}