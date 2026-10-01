package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Disciplines;
import com.lacouf.rsbjwt.model.OffreDeStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OffreDeStageRepository extends JpaRepository<OffreDeStage,Long> {

    List<OffreDeStage> findByDiscipline(Disciplines discipline);

    List<OffreDeStage> findBySalaireBetween(Double min, Double max);

    List<OffreDeStage> findAllByOrderBySalaireAsc();

    List<OffreDeStage> findAllByOrderBySalaireDesc();

    List<OffreDeStage> findByNomEntreprise(String nomEntreprise);
}
