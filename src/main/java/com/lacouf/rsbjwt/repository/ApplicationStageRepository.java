package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationStageRepository extends JpaRepository<ApplicationStage, Long> {

    List<ApplicationStage> findByEtudiantId(Long etudiantId);

    List<ApplicationStage> findByOffreDeStageId(Long offreDeStageId);

    @Override
    Optional<ApplicationStage> findById(Long applicationStageId);

    Optional<ApplicationStage> findByEtudiantIdAndByOffreDeStageId(Long etudiantId, Long offreDeStageId);
}
