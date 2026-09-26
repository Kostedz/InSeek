package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.acteurs.Disciplines;
import com.lacouf.rsbjwt.model.documents.Document;
import org.springframework.data.jpa.repository.JpaRepository;



public interface DocumentRepository extends JpaRepository<Document, Long> {
    boolean existsByFileNameAndTargetDiscipline(String fileName, Disciplines targetDiscipline);
}
