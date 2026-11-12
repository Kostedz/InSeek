package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.StatutContrat;
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

    boolean existsByStudentIdAndContractStatusInAndIdNot(
            Long studentId, Collection<StatutContrat> statuses, Long contractId);

    List<Contract> findByStudentIdOrderByDateCreationDesc(Long studentId);
    List<Contract> findAllByOrderByDateCreationDesc();

    List<Contract> findByEmployer_IdOrderByDateCreationDesc(Long employerId);


}
