package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.ApplicationStage;
import com.lacouf.rsbjwt.model.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationStageRepository extends JpaRepository<ApplicationStage, Long> {

    List<ApplicationStage> findByEtudiantId(Long etudiantId);

    List<ApplicationStage> findByOffreDeStageId(Long offreDeStageId);

    Optional<ApplicationStage> findById(Long applicationStageId);

    Optional<ApplicationStage> findByEtudiantIdAndOffreDeStageId(Long etudiantId, Long offreDeStageId);

    boolean existsByEtudiantIdAndOffreDeStageId(Long etudiantId, Long offreDeStageId);

    boolean existsByOffreDeStageIdAndStatutValidation(Long offreDeStageId, StatutValidation statutValidation);
}
