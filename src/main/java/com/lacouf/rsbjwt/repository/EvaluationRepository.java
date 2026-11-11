package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CompanyEvaluation;
import com.lacouf.rsbjwt.model.Evaluation;
import com.lacouf.rsbjwt.model.EvaluationState;
import com.lacouf.rsbjwt.model.StudentEvaluation;
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
    @Query("""
        SELECT studentEvaluation FROM StudentEvaluation studentEvaluation
        WHERE   studentEvaluation.employer.id = :employerId
          AND   studentEvaluation.intern.id = :internId
          AND   studentEvaluation.contract.id = :contractId
        """)
    Optional<StudentEvaluation> findStudentEvaluation(@Param("employerId") Long employerId, @Param("internId") Long internId, @Param("contractId") Long contractId);

    @Query("""
        SELECT COUNT(studentEvaluation) > 0 FROM StudentEvaluation studentEvaluation
        WHERE studentEvaluation.contract.id = :contractId 
          AND studentEvaluation.evaluationState = :evaluationState
    """)
    boolean existsStudentEvaluationByContractAndEvaluationState(@Param("contractId") Long contractId, @Param("evaluationState") EvaluationState evaluationState);

    @Query("""
        SELECT studentEvaluation FROM StudentEvaluation studentEvaluation 
        WHERE studentEvaluation.employer.id = :employerId 
          AND studentEvaluation.evaluationState = :evaluationState
    """)
    List<StudentEvaluation> findStudentEvaluationsByEmployerAndState(@Param("employerId") Long employerId,@Param("evaluationState") EvaluationState evaluationState);
}
