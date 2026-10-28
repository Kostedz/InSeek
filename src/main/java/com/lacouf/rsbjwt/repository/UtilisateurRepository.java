package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    @Query("SELECT u FROM Utilisateur u WHERE u.credentials.email = :email")
    Utilisateur findByEmail(@Param("email") String email);

    @Query("SELECT u FROM Utilisateur  u WHERE u.id = :id")
    Utilisateur findUtilisateurById(@Param("id") Long id);

    @Query("SELECT e FROM Etudiant e WHERE e.statutRecherche = :statut")
    List<Etudiant> findEtudiantsByStatutRecherche(@Param("statut") StatutRechercheEtudiant status);
    @Query("SELECT p FROM Professeur p WHERE p.discipline = :discipline")
    List<Professeur> findProfesseursByDiscipline(@Param("discipline") Disciplines fieldOfStudy);
}
