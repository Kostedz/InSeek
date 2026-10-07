package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    boolean existsByFileNameAndTargetDiscipline(String fileName, Disciplines targetDiscipline);
    List<Document> findByStatut(StatutValidation statut);

    @Query("""
           SELECT n
           FROM OffreDeStage n
           WHERE LOWER(n.nomEntreprise) LIKE LOWER(CONCAT('%', :nomCompagnie, '%'))        
                """)
    List<OffreDeStage> findOffreStagedByNomCompagnie(String nomCompagnie);

    @Query("""
           SELECT d 
           FROM OffreDeStage d
           WHERE d.targetDiscipline = :targetDiscipline
                        """)
    List<OffreDeStage> findOffreStageByTargetDiscipline(Disciplines targetDiscipline);

    @Query("""
           SELECT p
           FROM OffreDeStage p
           WHERE LOWER(p.position) LIKE LOWER(CONCAT('%', :position, '%'))        
                """)
    List<OffreDeStage> findOffreStageByPosition(String position);

    @Query("""
            SELECT s 
            FROM OffreDeStage s
            WHERE s.salaire 
            BETWEEN :minSalaire AND :maxSalaire
                        """)
    List<OffreDeStage> findOffreStageBySalaireBetween(Double minSalaire, Double maxSalaire);

    @Query("""
            SELECT s 
            FROM OffreDeStage s
            WHERE s.salaire > :minSalaire
                        """)
    List<OffreDeStage> findOffreStageByMinimumSalaire(Double minSalaire);

    @Query("""
            SELECT d 
            FROM OffreDeStage d 
            WHERE  d.dateDebutStage = :dateDebutStage
                        """)
    List<OffreDeStage> findOffreStageByDateDebutStage(LocalDate dateDebutStage);

    @Query("""
            SELECT d 
            FROM OffreDeStage d 
            WHERE  d.dateFinStage = :dateFinStage
                        """)
    List<OffreDeStage> findOffreStageByDateFinStage(LocalDate dateFinStage);

    @Query("""
            SELECT o FROM OffreDeStage o
            """)
    List<OffreDeStage> findAllOffreStage();

    @Query("""
            SELECT o 
            FROM OffreDeStage o
            WHERE o.id = :id
            """)
    Optional<OffreDeStage> findOffreStageById(Long id);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.utilisateur = :employeur
            ORDER BY o.id DESC
            """)
    List<OffreDeStage> findOffersByEmployer(@Param("employeur") com.lacouf.rsbjwt.model.Utilisateur employeur);

    CV findByUtilisateur(Utilisateur utilisateur);
}