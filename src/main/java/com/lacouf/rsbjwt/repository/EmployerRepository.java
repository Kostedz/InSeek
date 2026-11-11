package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Employeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmployerRepository extends JpaRepository<Employeur,Long> {
    @Query("SELECT employer FROM Employeur employer WHERE employer.credentials.email = :email")
    Optional<Employeur> findByEmail(@Param("email") String email);
}
