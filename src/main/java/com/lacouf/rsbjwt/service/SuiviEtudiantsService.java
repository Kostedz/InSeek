package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.service.dto.ApplicationStageDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SuiviEtudiantsService {

    private final EtudiantRepository etudiantRepository;
    private final ApplicationStageService applicationStageService;

    @Transactional(readOnly = true)
    public List<StagiaireDTO> listEtudiantsDuProfesseur(String professeurEmail) {
        return etudiantRepository.findByProfesseurEmail(professeurEmail)
                .stream()
                .map(StagiaireDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationStageDTO> listDemandesDeStage(String professeurEmail, Long etudiantId)
            throws NotFoundException, BadRequestException {
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new NotFoundException("Étudiant non trouvé"));

        boolean estSuperviseur = etudiant.getProfesseur() != null
                && etudiant.getProfesseur().getEmail().equalsIgnoreCase(professeurEmail);
        if (!estSuperviseur) {
            throw new NotFoundException("Étudiant non trouvé");
        }

        return applicationStageService.findApplicationsForStudent(etudiant);
    }
}