package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Entrevue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EntrevueRepository extends JpaRepository<Entrevue, Long> {
    //chercher toutes entrevues dont la date est deja passée
    List<Entrevue> findByDateInterviewBefore(LocalDateTime dateInterview);

     boolean existsByStudentIdAndInternshipOfferId(Long studentId, Long offerId);

    Optional<Entrevue> findByStudentIdAndInternshipOfferId(Long studentId, Long offerId);
}
