package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.CandidatureRepository;
import com.lacouf.rsbjwt.repository.DocumentRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.CandidatureDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatureServiceTest {

    @Mock private CandidatureRepository candidatureRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private UtilisateurService utilisateurService;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks private CandidatureService candidatureService;

    private MockHttpServletRequest request;
    private Employeur employeur;
    private Etudiant etudiant;
    private Candidature candidature;

    @BeforeEach
    void setUp() throws Exception {
        request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer fake-jwt");

        employeur = Employeur.builder().id(1L).nom("Ubi").prenom("Soft")
                .email("ubisoft@mail.com").nomCompagnie("UbiSoft").build();
        etudiant = Etudiant.builder().id(2L).nom("Doe").prenom("John")
                .email("john@mail.com").discipline(Disciplines.INFORMATIQUE).build();

        OffreDeStage offre = OffreDeStage.builder()
                .id(10L).fileName("offre.pdf").targetDiscipline(Disciplines.INFORMATIQUE)
                .employeur(employeur).position("Dev").descriptionPosition("desc")
                .dateDebutStage(LocalDate.now()).dateFinStage(LocalDate.now().plusDays(30))
                .adresseEntreprise("Montréal").build();

        candidature = Candidature.builder().id(5L).etudiant(etudiant).offre(offre).build();

        lenient().when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("ubisoft@mail.com");
        lenient().when(utilisateurService.findEntityByEmail("ubisoft@mail.com")).thenReturn(employeur);
        lenient().when(documentRepository.findByUtilisateur(etudiant)).thenReturn(null);
    }

    @Test
    @DisplayName("accepter - succès")
    void accepter_succes() throws Exception {
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        CandidatureDTO dto = candidatureService.accepter(5L, request);

        assertEquals(StatutCandidature.ACCEPTEE, dto.statut());
        assertNotNull(candidature.getDateDecision());
        verify(candidatureRepository).save(candidature);
    }

    @Test
    @DisplayName("refuser - succès avec commentaire")
    void refuser_succes() throws Exception {
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        CandidatureDTO dto = candidatureService.refuser(5L, "Profil non adapté", request);

        assertEquals(StatutCandidature.REFUSEE, dto.statut());
        assertEquals("Profil non adapté", dto.commentaireRefus());
        verify(candidatureRepository).save(candidature);
    }

    @Test
    @DisplayName("refuser - sans commentaire lance BadRequestException")
    void refuser_sansCommentaire() {
        assertThrows(BadRequestException.class, () -> candidatureService.refuser(5L, "  ", request));
        assertThrows(BadRequestException.class, () -> candidatureService.refuser(5L, null, request));
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("accepter - candidature déjà traitée lance BadRequestException")
    void accepter_dejaTraitee() {
        candidature.setStatut(StatutCandidature.REFUSEE);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(BadRequestException.class, () -> candidatureService.accepter(5L, request));
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("accepter - candidature d'un autre employeur lance NotFoundException")
    void accepter_autreEmployeur() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("autre@mail.com");
        Employeur autre = Employeur.builder().id(9L).nom("A").prenom("B")
                .email("autre@mail.com").nomCompagnie("Autre").build();
        when(utilisateurService.findEntityByEmail("autre@mail.com")).thenReturn(autre);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(NotFoundException.class, () -> candidatureService.accepter(5L, request));
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("accepter - candidature inexistante lance NotFoundException")
    void accepter_inexistante() {
        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> candidatureService.accepter(99L, request));
    }

    @Test
    @DisplayName("listerCandidatures - filtre par offre")
    void lister_parOffre() throws Exception {
        when(candidatureRepository.findByEmployeurEmailAndOffreId("ubisoft@mail.com", 10L))
                .thenReturn(List.of(candidature));

        List<CandidatureDTO> result = candidatureService.listerCandidatures(10L, request);

        assertEquals(1, result.size());
        assertEquals("AUCUNE", result.get(0).etatEntrevue());
    }

    @Test
    @DisplayName("listerCandidatures - sans offreId retourne toutes les candidatures")
    void lister_toutes() throws Exception {
        when(candidatureRepository.findByEmployeurEmail("ubisoft@mail.com"))
                .thenReturn(List.of(candidature));

        assertEquals(1, candidatureService.listerCandidatures(null, request).size());
    }
}