package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    boolean existsByFileNameAndTargetDiscipline(String fileName, Disciplines targetDiscipline);
    List<Document> findByStatut(StatutValidation statut);
}