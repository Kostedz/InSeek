package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.document.CV;
import com.lacouf.rsbjwt.model.document.OffreDeStage;
import com.lacouf.rsbjwt.model.utilisateur.Disciplines;
import com.lacouf.rsbjwt.model.utilisateur.Employeur;
import com.lacouf.rsbjwt.model.utilisateur.Etudiant;
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


    @Test
    @DisplayName("getCandidature - succès")
    void getCandidature_succes() throws Exception {
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        CandidatureDTO dto = candidatureService.getCandidature(5L, request);

        assertNotNull(dto);
        assertEquals(StatutCandidature.EN_ATTENTE, dto.statut());
    }

    @Test
    @DisplayName("getCandidature - inexistante lance NotFoundException")
    void getCandidature_inexistante() {
        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> candidatureService.getCandidature(99L, request));
    }

    @Test
    @DisplayName("getCandidature - autre employeur lance NotFoundException")
    void getCandidature_autreEmployeur() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("autre@mail.com");
        Employeur autre = Employeur.builder().id(9L).nom("A").prenom("B")
                .email("autre@mail.com").nomCompagnie("Autre").build();
        when(utilisateurService.findEntityByEmail("autre@mail.com")).thenReturn(autre);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(NotFoundException.class, () -> candidatureService.getCandidature(5L, request));
    }


    @Test
    @DisplayName("getCvCandidature - succès retourne le fichier du CV")
    void getCvCandidature_succes() throws Exception {
        CV cv = mock(CV.class);
        when(cv.getData()).thenReturn(new byte[]{1, 2, 3});
        when(cv.getContentType()).thenReturn("application/pdf");
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(cv);

        DocumentService.DocumentFile file = candidatureService.getCvCandidature(5L, request);

        assertNotNull(file);
    }

    @Test
    @DisplayName("getCvCandidature - CV absent lance NotFoundException")
    void getCvCandidature_cvAbsent() {
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> candidatureService.getCvCandidature(5L, request));

        assertEquals("CV non trouvé", ex.getMessage());
    }

    @Test
    @DisplayName("getCvCandidature - autre employeur lance NotFoundException")
    void getCvCandidature_autreEmployeur() throws Exception {
        when(jwtTokenProvider.getEmailFromJWT("fake-jwt")).thenReturn("autre@mail.com");
        Employeur autre = Employeur.builder().id(9L).nom("A").prenom("B")
                .email("autre@mail.com").nomCompagnie("Autre").build();
        when(utilisateurService.findEntityByEmail("autre@mail.com")).thenReturn(autre);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(NotFoundException.class, () -> candidatureService.getCvCandidature(5L, request));
        verify(documentRepository, never()).findByUtilisateur(any());
    }


    @Test
    @DisplayName("listerCandidatures - inclut l'id du CV quand l'étudiant en a un")
    void lister_avecCv() throws Exception {
        CV cv = mock(CV.class);
        when(cv.getId()).thenReturn(77L);
        when(documentRepository.findByUtilisateur(etudiant)).thenReturn(cv);
        when(candidatureRepository.findByEmployeurEmail("ubisoft@mail.com"))
                .thenReturn(List.of(candidature));

        List<CandidatureDTO> result = candidatureService.listerCandidatures(null, request);

        assertEquals(1, result.size());
        verify(cv).getId();
    }

    @Test
    @DisplayName("listerCandidatures - sans en-tête Authorization lance BadRequestException")
    void lister_sansHeader() {
        MockHttpServletRequest sansHeader = new MockHttpServletRequest();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> candidatureService.listerCandidatures(null, sansHeader));

        assertEquals("Invalid JWT token", ex.getMessage());
        verifyNoInteractions(candidatureRepository);
    }

    @Test
    @DisplayName("listerCandidatures - en-tête sans préfixe Bearer lance BadRequestException")
    void lister_sansBearer() {
        MockHttpServletRequest sansBearer = new MockHttpServletRequest();
        sansBearer.addHeader("Authorization", "fake-jwt");

        assertThrows(BadRequestException.class,
                () -> candidatureService.listerCandidatures(10L, sansBearer));

        verifyNoInteractions(candidatureRepository);
    }

    @Test
    @DisplayName("refuser - candidature déjà traitée lance BadRequestException")
    void refuser_dejaTraitee() {
        candidature.setStatut(StatutCandidature.ACCEPTEE);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> candidatureService.refuser(5L, "Raison", request));

        assertEquals("Cette candidature a déjà été traitée.", ex.getMessage());
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("refuser - candidature inexistante lance NotFoundException")
    void refuser_inexistante() {
        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> candidatureService.refuser(99L, "Raison", request));
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("refuser - retire les espaces autour du commentaire et enregistre la date de décision")
    void refuser_trimCommentaire() throws Exception {
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        candidatureService.refuser(5L, "  Profil non adapté  ", request);

        assertEquals("Profil non adapté", candidature.getCommentaireRefus());
        assertNotNull(candidature.getDateDecision());
    }

    @Test
    @DisplayName("accepter - efface le commentaire de refus")
    void accepter_effaceCommentaireRefus() throws Exception {
        candidature.setCommentaireRefus("ancien commentaire");
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        candidatureService.accepter(5L, request);

        assertNull(candidature.getCommentaireRefus());
    }

    @Test
    @DisplayName("accepter - candidature déjà acceptée lance BadRequestException")
    void accepter_dejaAcceptee() {
        candidature.setStatut(StatutCandidature.ACCEPTEE);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(BadRequestException.class, () -> candidatureService.accepter(5L, request));
        verify(candidatureRepository, never()).save(any());
    }
}