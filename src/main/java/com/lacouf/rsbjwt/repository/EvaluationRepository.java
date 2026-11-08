package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CompanyEvaluation;
import com.lacouf.rsbjwt.model.Evaluation;
import com.lacouf.rsbjwt.model.EvaluationState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    @Query("""
        SELECT companyEvaluation FROM CompanyEvaluation companyEvaluation 
        WHERE companyEvaluation.teacher.id = :teacherId 
          AND companyEvaluation.studentIntern.id = :studentId
          AND companyEvaluation.contract.id = :contractId
    """)
    Optional<CompanyEvaluation> findCompanyEvaluation(@Param("teacherId") Long teacherId, @Param("studentId") Long studentId, @Param("contractId") Long contractId
    );

    @Query("""
        SELECT COUNT(companyEvaluation) > 0 FROM CompanyEvaluation companyEvaluation 
        WHERE companyEvaluation.contract.id = :contractId 
          AND companyEvaluation.evaluationState = :evaluationState
    """)
    boolean existsCompanyEvaluationByContractAndEvaluationState(@Param("contractId") Long contractId, @Param("evaluationState") EvaluationState evaluationState);

    @Query("""
        SELECT companyEvaluation FROM CompanyEvaluation companyEvaluation 
        WHERE companyEvaluation.teacher.id = :teacherId 
          AND companyEvaluation.evaluationState = :evaluationState
    """)
    List<CompanyEvaluation> findCompanyEvaluationsByProfesseurAndState(@Param("teacherId") Long teacherId,
            @Param("evaluationState") EvaluationState evaluationState
    );

    //Student Evaluation ici
}
