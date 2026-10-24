package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Etudiant;
import com.lacouf.rsbjwt.model.Professeur;
import com.lacouf.rsbjwt.repository.EtudiantRepository;
import com.lacouf.rsbjwt.repository.ProfesseurRepository;
import com.lacouf.rsbjwt.service.dto.ProfesseurDTO;
import com.lacouf.rsbjwt.service.dto.StagiaireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignationProfesseurService {

    private final EtudiantRepository etudiantRepository;
    private final ProfesseurRepository professeurRepository;

    @Transactional(readOnly = true)
    public List<StagiaireDTO> listStagiaires() {
        return etudiantRepository.findAll()
                .stream()
                .map(StagiaireDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfesseurDTO> listProfesseurs() {
        return professeurRepository.findAll()
                .stream()
                .map(ProfesseurDTO::of)
                .toList();
    }

    @Transactional
    public StagiaireDTO assignerProfesseur(Long etudiantId, Long professeurId)
            throws NotFoundException, BadRequestException {
        if (professeurId == null) {
            throw new BadRequestException("Un professeur doit être sélectionné.");
        }

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new NotFoundException("Étudiant non trouvé"));
        Professeur professeur = professeurRepository.findById(professeurId)
                .orElseThrow(() -> new NotFoundException("Professeur non trouvé"));

        etudiant.setProfesseur(professeur);
        etudiantRepository.save(etudiant);

        return StagiaireDTO.of(etudiant);
    }
}