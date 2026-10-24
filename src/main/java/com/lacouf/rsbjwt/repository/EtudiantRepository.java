package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {

    @Query("""
            SELECT e
            FROM Etudiant e
            WHERE e.professeur.credentials.email = :email
            ORDER BY e.nom, e.prenom
            """)
    List<Etudiant> findByProfesseurEmail(@Param("email") String email);
}