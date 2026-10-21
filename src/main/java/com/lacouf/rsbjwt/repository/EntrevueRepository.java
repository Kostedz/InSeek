package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EntrevueRepository extends JpaRepository<Entrevue, Long> {
    List<Entrevue> findByDateInterviewBefore(LocalDateTime dateInterview);
    List<Entrevue> findByStudentIdAndInterviewInvitationStatus(Long studentId, StatutConvocationEntrevue interviewInvitationStatus);
    List<Entrevue> findByStudentId(Long studentId);

     boolean existsByStudentIdAndInternshipOfferId(Long studentId, Long offerId);

    Optional<Entrevue> findByStudentIdAndInternshipOfferId(Long studentId, Long offerId);
}
