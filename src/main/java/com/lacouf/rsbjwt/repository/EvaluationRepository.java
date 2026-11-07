package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
}
