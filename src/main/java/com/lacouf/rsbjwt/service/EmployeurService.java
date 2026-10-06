package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.OffreDeStage;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.service.dto.OffreDeStageDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class EmployeurService {
    private final DocumentRepository documentRepository;

    public EmployeurService(DocumentRepository documentRepository
                                                                ){
        this.documentRepository = documentRepository;
    }

    public OffreDeStageDTO ajouterOffreDeStage(String nomEntreprise, String position, String descriptionPosition, LocalDate dateDebutStage, LocalDate dateFinStage, String adresseEntreprise, Double salaire){
        OffreDeStage offreDeStage = new OffreDeStage();
        return null;
    }
}
