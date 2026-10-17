package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ApplicationStageRepository extends JpaRepository<ApplicationStage, Long> {

    List<ApplicationStage> findByEtudiantId(Long etudiantId);

    List<ApplicationStage> findByOffreDeStageId(Long offreDeStageId);

    Optional<ApplicationStage> findById(Long applicationStageId);

    Optional<ApplicationStage> findByEtudiantIdAndOffreDeStageId(Long etudiantId, Long offreDeStageId);

    boolean existsByEtudiantIdAndOffreDeStageId(Long etudiantId, Long offreDeStageId);

    boolean existsByOffreDeStageIdAndStatutValidation(Long offreDeStageId, StatutValidation statutValidation);

    @Query("""
            SELECT application.offreDeStage.id
            FROM ApplicationStage application
            WHERE application.etudiant.id = :etudiantId
            """)
    List<Long> findOfferIdsByEtudiantId(@Param("etudiantId") Long etudiantId);
}
