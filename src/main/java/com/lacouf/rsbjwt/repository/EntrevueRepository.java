package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Entrevue;
import com.lacouf.rsbjwt.model.StatutConvocationEntrevue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EntrevueRepository extends JpaRepository<Entrevue, Long> {
    List<Entrevue> findByDateInterviewBefore(LocalDateTime dateInterview);
    List<Entrevue> findByStudentIdAndInterviewInvitationStatus(Long studentId, StatutConvocationEntrevue interviewInvitationStatus);
    List<Entrevue> findByStudentId(Long studentId);
}
