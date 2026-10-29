package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratRepository extends JpaRepository<Contract, Long> {
    boolean existsByStudentId(Long studentId);
    boolean existsByStudentIdAndInternshipOfferId(Long studentId, Long internshipOfferId);
    Optional<Contract> findByStudentId(Long studentId);
    List<Contract> findAllByOrderByDateCreationDesc();
    List<Contract> findByEmployerId(Long employerId);


}
