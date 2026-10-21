package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Candidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {

    @Query("""
            SELECT c
            FROM Candidature c
            WHERE c.offre.utilisateur.credentials.email = :email
            ORDER BY c.dateCandidature DESC
            """)
    List<Candidature> findByEmployeurEmail(@Param("email") String email);

    @Query("""
            SELECT c
            FROM Candidature c
            WHERE c.offre.utilisateur.credentials.email = :email
              AND c.offre.id = :offreId
            ORDER BY c.dateCandidature DESC
            """)
    List<Candidature> findByEmployeurEmailAndOffreId(@Param("email") String email,
                                                     @Param("offreId") Long offreId);
}