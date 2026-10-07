package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.Document;
import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.model.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    boolean existsByFileNameAndTargetDiscipline(String fileName, Disciplines targetDiscipline);
    List<Document> findByStatut(StatutValidation statut);

    @Query("""
           SELECT n
           FROM OffreDeStage n
           WHERE LOWER(n.nomEntreprise) LIKE LOWER(CONCAT('%', :nomCompagnie, '%'))        
                """)
    List<OffreDeStage> findByNomCompagnie(String nomCompagnie);

    List<OffreDeStage> findByTargetDiscipline(Disciplines targetDiscipline);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.utilisateur = :employeur
            ORDER BY o.id DESC
            """)
    List<OffreDeStage> findOffersByEmployer(@Param("employeur") com.lacouf.rsbjwt.model.Utilisateur employeur);
}
