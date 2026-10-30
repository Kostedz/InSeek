package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Contract;
import com.lacouf.rsbjwt.model.StatutContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface ContratRepository extends JpaRepository<Contract, Long> {
    boolean existsByStudentId(Long studentId);
    boolean existsByStudentIdAndInternshipOfferId(Long studentId, Long internshipOfferId);

    Optional<Contract> findByStudentIdAndInternshipOfferId(Long studentId, Long internshipOfferId);

    boolean existsByStudentIdAndContractStatusInAndContractIdNot(
            Long studentId, Collection<StatutContrat> statuses, Long contractId);

    List<Contract> findByStudentIdOrderByDateCreationDesc(Long studentId);
    List<Contract> findAllByOrderByDateCreationDesc();
    List<Contract> findByEmployerId(Long employerId);


}
