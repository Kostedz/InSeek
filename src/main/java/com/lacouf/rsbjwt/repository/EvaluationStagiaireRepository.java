package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.EvaluationStagiaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluationStagiaireRepository extends JpaRepository<EvaluationStagiaire, Long> {
    boolean existsByContratId(Long contratId);
    Optional<EvaluationStagiaire> findByContratId(Long contratId);
}