package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    @Query("SELECT u FROM Utilisateur u WHERE u.credentials.email = :email")
    Utilisateur findByEmail(@Param("email") String email);
}
