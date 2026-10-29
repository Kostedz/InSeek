package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Contract;
import com.lacouf.rsbjwt.model.StatutContrat;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record ContratDTO(
        Long id,
        String studentFullName,
        String studentEmail,
        String fieldOfStudy,
        String companyName,
        String employerFullName,
        String offerTitle,
        String supervisorName,
        String assignedTeacherName,
        LocalDate internshipStartingDate,
        LocalDate internshipEndingDate,
        double weeklyHours,
        Double hourlySalary,
        String internshipLocation,
        StatutContrat contractStatus,
        LocalDateTime contractDateCreation
) {
    public static ContratDTO of(Contract contract) {
        String studentFullName = contract.getStudent() != null ? contract.getStudent().getPrenom() + " " +
                contract.getStudent().getNom() : "";
        String employerFullName = contract.getEmployer() != null ? contract.getEmployer().getPrenom() + " " +
                contract.getEmployer().getNom() : "";
        String companyName = contract.getEmployer() != null ? contract.getEmployer().getNomCompagnie(): "";
        String discipline = contract.getStudent() != null && contract.getStudent().getDiscipline() != null
                ? contract.getStudent().getDiscipline().name() : "";
        String teacherName = contract.getTeacher() != null ? contract.getTeacher().getPrenom() + " " + contract.getTeacher().getNom() : null;
        return ContratDTO.builder()
                .id(contract.getContractId())
                .studentFullName(studentFullName)
                .studentEmail(contract.getStudent().getEmail())
                .fieldOfStudy(discipline)
                .companyName(companyName)
                .employerFullName(employerFullName)
                .offerTitle(contract.getInternshipOffer().getPosition())
                .supervisorName(contract.getSupervisorName())
                .assignedTeacherName(teacherName)
                .internshipStartingDate(contract.getStartingDate())
                .internshipEndingDate(contract.getEndingDate())
                .weeklyHours(contract.getWeeklyHours())
                .hourlySalary(contract.getHourlySalary())
                .internshipLocation(contract.getInternshipLocation())
                .contractStatus(contract.getContractStatus())
                .contractDateCreation(contract.getDateCreation())
                .build();
    }
}
