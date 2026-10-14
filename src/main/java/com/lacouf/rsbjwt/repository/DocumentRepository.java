package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
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
            SELECT new com.lacouf.rsbjwt.service.dto.OffreDeStageDTO(
                o.id, o.fileName, o.utilisateur.credentials.email, o.nomEntreprise,
                o.position, o.descriptionPosition, o.dateDebutStage, o.dateFinStage,
                o.adresseEntreprise, o.statut, o.commentaireRejet, o.salaire,
                o.targetDiscipline, o.contactName, o.contactPhone, o.version, o.updatedAt
            )
            FROM OffreDeStage o
            WHERE o.statut = :statut
            ORDER BY o.updatedAt DESC, o.id DESC
            """)
    List<OffreDeStageDTO> findOffreStageSummariesByStatut(@Param("statut") StatutValidation statut);

    @Query("""
            SELECT new com.lacouf.rsbjwt.service.dto.OffreDeStageDTO(
                o.id, o.fileName, o.utilisateur.credentials.email, o.nomEntreprise,
                o.position, o.descriptionPosition, o.dateDebutStage, o.dateFinStage,
                o.adresseEntreprise, o.statut, o.commentaireRejet, o.salaire,
                o.targetDiscipline, o.contactName, o.contactPhone, o.version, o.updatedAt
            )
            FROM OffreDeStage o
            WHERE o.id = :id
            """)
    Optional<OffreDeStageDTO> findOffreStageSummaryById(@Param("id") Long id);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.id = :id
            """)
    Optional<OffreDeStage> findInternshipOfferById(Long id);

    @Query("""
            SELECT o
            FROM OffreDeStage o
            WHERE o.utilisateur = :employeur
            ORDER BY o.id DESC
            """)
    List<OffreDeStage> findOffersByEmployer(@Param("employeur") com.lacouf.rsbjwt.model.Utilisateur employeur);

    CV findByUtilisateur(Utilisateur utilisateur);

    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
            FROM CV c
            WHERE c.utilisateur = :student
              AND c.statut = :statut
            """)
    boolean existsStudentCvByStatut(@Param("student") Utilisateur student,
                                    @Param("statut") StatutValidation statut);

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
