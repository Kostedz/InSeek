package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Contract;
import com.lacouf.rsbjwt.model.StatutContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContratRepository extends JpaRepository<Contract, Long> {
    boolean existsByStudentId(Long studentId);
    boolean existsByStudentIdAndInternshipOfferId(Long studentId, Long internshipOfferId);

    Optional<Contract> findByStudentIdAndInternshipOfferId(Long studentId, Long internshipOfferId);

    boolean existsByStudentIdAndContractStatusInAndIdNot(
            Long studentId, Collection<StatutContrat> statuses, Long contractId);

    List<Contract> findByStudentIdOrderByDateCreationDesc(Long studentId);
    List<Contract> findAllByOrderByDateCreationDesc();

    List<Contract> findByEmployer_IdOrderByDateCreationDesc(Long employerId);

    List<Contract> findByContractStatusInAndEndingDateBetween(
            Collection<StatutContrat> statuses, LocalDate from, LocalDate to);
}