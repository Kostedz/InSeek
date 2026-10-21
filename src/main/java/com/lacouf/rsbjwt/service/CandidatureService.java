package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.Candidature;
import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.StatutCandidature;
import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.CandidatureRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CandidatureDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidatureService {
    private final CandidatureRepository candidatureRepository;
    private final DocumentRepository documentRepository;
    private final UtilisateurService utilisateurService;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional(readOnly = true)
    public List<CandidatureDTO> listerCandidatures(Long offreId, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        String email = getEmailEmployeur(request);
        List<Candidature> candidatures = offreId == null
                ? candidatureRepository.findByEmployeurEmail(email)
                : candidatureRepository.findByEmployeurEmailAndOffreId(email, offreId);
        return candidatures.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public CandidatureDTO getCandidature(Long id, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        return toDTO(getCandidatureDeEmployeur(id, request));
    }

    @Transactional(readOnly = true)
    public DocumentService.DocumentFile getCvCandidature(Long id, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        Candidature c = getCandidatureDeEmployeur(id, request);
        CV cv = documentRepository.findByUtilisateur(c.getEtudiant());
        if (cv == null) {
            throw new NotFoundException("CV non trouvé");
        }
        return new DocumentService.DocumentFile(cv.getData(), cv.getContentType());
    }

    @Transactional
    public CandidatureDTO accepter(Long id, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        Candidature c = getCandidatureDeEmployeur(id, request);
        verifierEnAttente(c);
        c.setStatut(StatutCandidature.ACCEPTEE);
        c.setCommentaireRefus(null);
        c.setDateDecision(LocalDateTime.now());
        candidatureRepository.save(c);
        return toDTO(c);
    }

    @Transactional
    public CandidatureDTO refuser(Long id, String commentaire, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        if (commentaire == null || commentaire.isBlank()) {
            throw new BadRequestException("Le commentaire est obligatoire pour refuser une candidature.");
        }
        Candidature c = getCandidatureDeEmployeur(id, request);
        verifierEnAttente(c);
        c.setStatut(StatutCandidature.REFUSEE);
        c.setCommentaireRefus(commentaire.trim());
        c.setDateDecision(LocalDateTime.now());
        candidatureRepository.save(c);
        return toDTO(c);
    }

    // - helpers

    private void verifierEnAttente(Candidature c) throws BadRequestException {
        if (c.getStatut() != StatutCandidature.EN_ATTENTE) {
            throw new BadRequestException("Cette candidature a déjà été traitée.");
        }
    }

    private Candidature getCandidatureDeEmployeur(Long id, HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        String email = getEmailEmployeur(request);
        Candidature c = candidatureRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Candidature non trouvée (id " + id + " inexistant dans la table candidature)"));

        Utilisateur proprietaire = c.getOffre().getUtilisateur();
        System.out.println("CHECK candidature=" + id
                + " proprietaire=" + (proprietaire == null ? null : proprietaire.getEmail())
                + " employeurConnecte=" + email);

        if (proprietaire == null || !proprietaire.getEmail().equals(email)) {
            throw new NotFoundException("Candidature non trouvée (propriétaire de l'offre différent de l'employeur connecté)");
        }
        return c;
    }

    private String getEmailEmployeur(HttpServletRequest request)
            throws BadRequestException, NotFoundException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new BadRequestException("Invalid JWT token");
        }
        String email = jwtTokenProvider.getEmailFromJWT(authorization.substring(7));
        return utilisateurService.findEntityByEmail(email).getEmail();
    }

    private CandidatureDTO toDTO(Candidature c) {
        CV cv = documentRepository.findByUtilisateur(c.getEtudiant());
        return CandidatureDTO.of(c, cv == null ? null : cv.getId());
    }
}