package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.*;
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

    @Query("""
           SELECT d 
           FROM OffreDeStage d
           WHERE d.targetDiscipline = :targetDiscipline
                        """)
    List<OffreDeStage> findByTargetDiscipline(Disciplines targetDiscipline);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.utilisateur = :employeur
            ORDER BY o.id DESC
            """)
    List<OffreDeStage> findOffersByEmployer(@Param("employeur") com.lacouf.rsbjwt.model.Utilisateur employeur);

    CV findByUtilisateur(Utilisateur utilisateur);

    @Query("""
            SELECT c
            FROM CV c
            WHERE c.statut = :statut
            """)
    List<Document> findCVByStatut(StatutValidation statut);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.statut = :statut
            """)
    List<Document> findOffreDeStageByStatut(StatutValidation statut);
}
