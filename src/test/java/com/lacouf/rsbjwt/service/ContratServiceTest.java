package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.BadRequestException;
import com.lacouf.rsbjwt.exception.ConflictException;
import com.lacouf.rsbjwt.exception.NotFoundException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import com.lacouf.rsbjwt.repository.ContratRepository;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.ContratDTO;
import com.lacouf.rsbjwt.service.dto.CreateContratDTO;
import com.lacouf.rsbjwt.service.dto.EtudiantEligibleContratDTO;
import com.lacouf.rsbjwt.service.dto.PreRemplirContratDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContratServiceTest {

    @Mock
    private ContratRepository contratRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private ApplicationStageRepository applicationStageRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private ContratService contratService;

    private Etudiant etudiant;
    private OffreDeStage offre;
    private Employeur employeur;
    private Professeur professeur;
    private Gestionnaire gestionnaire;
    private ApplicationStage applicationAcceptee;

    @BeforeEach
    void setUp() {
        etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);
        when(etudiant.getPrenom()).thenReturn("Alice");
        when(etudiant.getNom()).thenReturn("Tremblay");
        when(etudiant.getDiscipline()).thenReturn(Disciplines.INFORMATIQUE);
        when(etudiant.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.INTERNSHIP_FOUND);

        employeur = mock(Employeur.class);
        when(employeur.getPrenom()).thenReturn("Will");
        when(employeur.getNom()).thenReturn("Gates");
        when(employeur.getNomCompagnie()).thenReturn("Microsoft");

        offre = mock(OffreDeStage.class);
        when(offre.getId()).thenReturn(10L);
        when(offre.getPosition()).thenReturn("Développeur Java");
        when(offre.getNomEntreprise()).thenReturn("Microsoft");
        when(offre.getEmployeur()).thenReturn(employeur);
        when(offre.getSalaire()).thenReturn(25.0);
        when(offre.getAdresseEntreprise()).thenReturn("123 rue Principale");

        professeur = mock(Professeur.class);
        when(professeur.getPrenom()).thenReturn("Bob");
        when(professeur.getNom()).thenReturn("Gagnon");

        gestionnaire = mock(Gestionnaire.class);

        applicationAcceptee = mock(ApplicationStage.class);
        when(applicationAcceptee.getStatutValidation()).thenReturn(StatutValidation.ACCEPTE);
        when(applicationAcceptee.getOffreDeStage()).thenReturn(offre);

        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(applicationStageRepository.findByEtudiantId(1L)).thenReturn(List.of(applicationAcceptee));
        when(utilisateurRepository.findProfesseursByDiscipline(Disciplines.INFORMATIQUE))
                .thenReturn(List.of(professeur));
        when(contratRepository.existsByStudentIdAndInternshipOfferId(1L, 10L)).thenReturn(false);
        when(contratRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        when(jwtTokenProvider.getEmailFromJWT("valid-token")).thenReturn("admin@mail.com");
        when(utilisateurRepository.findByEmail("admin@mail.com")).thenReturn(gestionnaire);
    }


    private CreateContratDTO dtoValide() {
        return dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3), 35, 25.0, "Montréal");
    }

    private CreateContratDTO dto(Long studentId, LocalDate debut, LocalDate fin,
                                 int heures, Double salaire, String lieu) {
        return new CreateContratDTO(studentId, 10L, debut, fin, heures, salaire, lieu);
    }

    private MockHttpServletRequest requeteAvecToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        return request;
    }


    @Test
    @DisplayName("getEtudiantsEligibles() sans étudiant avec stage trouvé retourne une liste vide")
    void getEtudiantsEligibles_aucunEtudiant_retourneListeVide() {
        when(utilisateurRepository.findEtudiantsByStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND))
                .thenReturn(List.of());

        List<EtudiantEligibleContratDTO> result = contratService.getEtudiantsEligibles();

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getEtudiantsEligibles() retourne une entrée par offre acceptée")
    void getEtudiantsEligibles_uneOffreAcceptee_retourneUneEntree() {
        when(utilisateurRepository.findEtudiantsByStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND))
                .thenReturn(List.of(etudiant));

        List<EtudiantEligibleContratDTO> result = contratService.getEtudiantsEligibles();

        assertEquals(1, result.size());
        verify(contratRepository).existsByStudentIdAndInternshipOfferId(1L, 10L);
    }

    @Test
    @DisplayName("getEtudiantsEligibles() ignore les candidatures non acceptées")
    void getEtudiantsEligibles_candidatureRefusee_ignoree() {
        ApplicationStage refusee = mock(ApplicationStage.class);
        when(refusee.getStatutValidation()).thenReturn(StatutValidation.REJETE);
        when(refusee.getOffreDeStage()).thenReturn(offre);

        when(applicationStageRepository.findByEtudiantId(1L)).thenReturn(List.of(refusee));
        when(utilisateurRepository.findEtudiantsByStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND))
                .thenReturn(List.of(etudiant));

        assertTrue(contratService.getEtudiantsEligibles().isEmpty());
    }

    @Test
    @DisplayName("getEtudiantsEligibles() avec plusieurs offres acceptées retourne plusieurs entrées")
    void getEtudiantsEligibles_plusieursOffres_retournePlusieursEntrees() {
        OffreDeStage offre2 = mock(OffreDeStage.class);
        when(offre2.getId()).thenReturn(11L);
        ApplicationStage app2 = mock(ApplicationStage.class);
        when(app2.getStatutValidation()).thenReturn(StatutValidation.ACCEPTE);
        when(app2.getOffreDeStage()).thenReturn(offre2);

        when(applicationStageRepository.findByEtudiantId(1L))
                .thenReturn(List.of(applicationAcceptee, app2));
        when(utilisateurRepository.findEtudiantsByStatutRecherche(StatutRechercheEtudiant.INTERNSHIP_FOUND))
                .thenReturn(List.of(etudiant));

        assertEquals(2, contratService.getEtudiantsEligibles().size());
    }


    @Test
    @DisplayName("getDonneesPreRemplies() avec des données valides retourne le DTO pré-rempli")
    void getDonneesPreRemplies_succes_retourneDTO() throws Exception {
        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertNotNull(result);
        assertEquals("Alice Tremblay", result.studentName());
        assertEquals("INFORMATIQUE", result.fieldOfStudy());
        assertEquals("Microsoft", result.companyName());
        assertEquals("Will Gates", result.employerName());
        assertEquals("Développeur Java", result.offerTitle());
        assertEquals("Bob Gagnon", result.assignedTeacherName());
        assertEquals(35, result.weeklyHours());
        assertEquals(25.0, result.hourlySalary());
        assertEquals("123 rue Principale", result.location());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() utilise le contact de l'offre comme superviseur")
    void getDonneesPreRemplies_contactName_utiliseCommeSuperviseur() throws Exception {
        when(offre.getContactName()).thenReturn("Jean Contact");

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals("Jean Contact", result.supervisorName());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans contact utilise l'employeur comme superviseur")
    void getDonneesPreRemplies_sansContact_employeurSuperviseur() throws Exception {
        when(offre.getContactName()).thenReturn(null);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals("Will Gates", result.supervisorName());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans professeur assigné retourne 'Non assigné'")
    void getDonneesPreRemplies_sansProfesseur_nonAssigne() throws Exception {
        when(utilisateurRepository.findProfesseursByDiscipline(Disciplines.INFORMATIQUE))
                .thenReturn(List.of());

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals("Non assigné", result.assignedTeacherName());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans discipline retourne un champ d'étude vide et aucun professeur")
    void getDonneesPreRemplies_sansDiscipline_champVide() throws Exception {
        when(etudiant.getDiscipline()).thenReturn(null);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals("", result.fieldOfStudy());
        assertEquals("Non assigné", result.assignedTeacherName());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans nom d'entreprise utilise celui de l'employeur")
    void getDonneesPreRemplies_sansNomEntreprise_utiliseEmployeur() throws Exception {
        when(offre.getNomEntreprise()).thenReturn(null);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals("Microsoft", result.companyName());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans salaire ni adresse utilise les valeurs par défaut")
    void getDonneesPreRemplies_sansSalaireNiAdresse_valeursParDefaut() throws Exception {
        when(offre.getSalaire()).thenReturn(null);
        when(offre.getAdresseEntreprise()).thenReturn(null);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals(0.0, result.hourlySalary());
        assertEquals("", result.location());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() sans dates sur l'offre propose des dates par défaut")
    void getDonneesPreRemplies_sansDates_datesParDefaut() throws Exception {
        when(offre.getDateDebutStage()).thenReturn(null);
        when(offre.getDateFinStage()).thenReturn(null);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals(LocalDate.now().plusDays(14), result.internshipStartDate());
        assertEquals(LocalDate.now().plusMonths(3), result.internshipEndDate());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() utilise les dates de l'offre quand elles existent")
    void getDonneesPreRemplies_avecDates_utiliseDatesOffre() throws Exception {
        LocalDate debut = LocalDate.now().plusDays(30);
        LocalDate fin = LocalDate.now().plusDays(120);
        when(offre.getDateDebutStage()).thenReturn(debut);
        when(offre.getDateFinStage()).thenReturn(fin);

        PreRemplirContratDTO result = contratService.getDonneesPreRemplies(1L, 10L);

        assertEquals(debut, result.internshipStartDate());
        assertEquals(fin, result.internshipEndDate());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() avec un étudiant introuvable lève une NotFoundException")
    void getDonneesPreRemplies_etudiantIntrouvable_leveNotFound() {
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.getDonneesPreRemplies(99L, 10L));

        assertEquals("Étudiant introuvable ", ex.getMessage());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() avec un utilisateur qui n'est pas un étudiant lève une NotFoundException")
    void getDonneesPreRemplies_pasUnEtudiant_leveNotFound() {
        when(utilisateurRepository.findById(2L)).thenReturn(Optional.of(mock(Professeur.class)));

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.getDonneesPreRemplies(2L, 10L));

        assertEquals("L'utilisateur spécifié n'est pas un étudiant.", ex.getMessage());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() avec un étudiant sans stage trouvé lève une BadRequestException")
    void getDonneesPreRemplies_statutNonTrouve_leveBadRequest() {
        when(etudiant.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.getDonneesPreRemplies(1L, 10L));

        assertEquals("L'étudiant n'a pas le statut STAGE TROUVÉ.", ex.getMessage());
    }

    @Test
    @DisplayName("getDonneesPreRemplies() avec une offre non acceptée lève une NotFoundException")
    void getDonneesPreRemplies_offreNonAcceptee_leveNotFound() {
        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.getDonneesPreRemplies(1L, 999L));

        assertEquals("Cette offre n'est pas une offre acceptée pour cet étudiant.", ex.getMessage());
    }


    @Test
    @DisplayName("creerContrat() avec des données valides sauvegarde un contrat en attente de signature")
    void creerContrat_succes_sauvegardeContrat() throws Exception {
        ContratDTO result = contratService.creerContrat(dtoValide(), requeteAvecToken());

        assertNotNull(result);
        ArgumentCaptor<Contract> captor = ArgumentCaptor.forClass(Contract.class);
        verify(contratRepository).save(captor.capture());

        Contract saved = captor.getValue();
        assertEquals(StatutContrat.PENDING_SIGNATURE, saved.getContractStatus());
        assertEquals(etudiant, saved.getStudent());
        assertEquals(employeur, saved.getEmployer());
        assertEquals(offre, saved.getInternshipOffer());
        assertEquals(professeur, saved.getTeacher());
        assertEquals(gestionnaire, saved.getAdmin());
        assertEquals(35, saved.getWeeklyHours());
        assertEquals(25.0, saved.getHourlySalary());
        assertEquals("Montréal", saved.getInternshipLocation());
        assertNotNull(saved.getDateCreation());
    }

    @Test
    @DisplayName("creerContrat() avec un salaire null enregistre un salaire de 0.0")
    void creerContrat_salaireNull_salaireZero() throws Exception {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, null, "Montréal");

        contratService.creerContrat(dto, requeteAvecToken());

        ArgumentCaptor<Contract> captor = ArgumentCaptor.forClass(Contract.class);
        verify(contratRepository).save(captor.capture());
        assertEquals(0.0, captor.getValue().getHourlySalary());
    }

    @Test
    @DisplayName("creerContrat() retire les espaces autour du lieu")
    void creerContrat_lieuAvecEspaces_trim() throws Exception {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, 20.0, "  Laval  ");

        contratService.creerContrat(dto, requeteAvecToken());

        ArgumentCaptor<Contract> captor = ArgumentCaptor.forClass(Contract.class);
        verify(contratRepository).save(captor.capture());
        assertEquals("Laval", captor.getValue().getInternshipLocation());
    }

    @Test
    @DisplayName("creerContrat() accepte une date de début égale à aujourd'hui")
    void creerContrat_debutAujourdhui_succes() throws Exception {
        CreateContratDTO dto = dto(1L, LocalDate.now(), LocalDate.now().plusMonths(3),
                35, 20.0, "Montréal");

        assertNotNull(contratService.creerContrat(dto, requeteAvecToken()));
    }


    @Test
    @DisplayName("creerContrat() avec un DTO null lève une BadRequestException")
    void creerContrat_dtoNull_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(null, requeteAvecToken()));

        assertEquals("Les données du contrat sont requises.", ex.getMessage());
        verify(contratRepository, never()).save(any());
    }

    @Test
    @DisplayName("creerContrat() sans identifiant d'étudiant lève une BadRequestException")
    void creerContrat_studentIdNull_leveBadRequest() {
        CreateContratDTO dto = dto(null, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("L'identifiant de l'étudiant est requis.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() sans date de début lève une BadRequestException")
    void creerContrat_dateDebutNull_leveBadRequest() {
        CreateContratDTO dto = dto(1L, null, LocalDate.now().plusMonths(3), 35, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("La date de début est requise.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() sans date de fin lève une BadRequestException")
    void creerContrat_dateFinNull_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), null, 35, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("La date de fin est requise.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec des heures hebdomadaires à 0 lève une BadRequestException")
    void creerContrat_heuresZero_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                0, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("Le nombre d'heures par semaine doit être supérieur à 0.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec un lieu null lève une BadRequestException")
    void creerContrat_lieuNull_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, 25.0, null);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("Le lieu est requis.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec un lieu vide lève une BadRequestException")
    void creerContrat_lieuVide_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, 25.0, "   ");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("Le lieu est requis.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec une rémunération négative lève une BadRequestException")
    void creerContrat_salaireNegatif_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(3),
                35, -5.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("La rémunération ne peut pas être négative.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec une date de début dans le passé lève une BadRequestException")
    void creerContrat_debutDansPasse_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().minusDays(1), LocalDate.now().plusMonths(3),
                35, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("La date de début ne peut pas être dans le passé.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec une date de fin égale à la date de début lève une BadRequestException")
    void creerContrat_finEgaleDebut_leveBadRequest() {
        LocalDate date = LocalDate.now().plusDays(10);
        CreateContratDTO dto = dto(1L, date, date, 35, 25.0, "Montréal");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));

        assertEquals("La date de fin doit être strictement postérieure à la date de début.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec une date de fin avant la date de début lève une BadRequestException")
    void creerContrat_finAvantDebut_leveBadRequest() {
        CreateContratDTO dto = dto(1L, LocalDate.now().plusDays(10), LocalDate.now().plusDays(5),
                35, 25.0, "Montréal");

        assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dto, requeteAvecToken()));
        verify(contratRepository, never()).save(any());
    }


    @Test
    @DisplayName("creerContrat() sans en-tête Authorization lève une BadRequestException")
    void creerContrat_sansHeader_leveBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dtoValide(), new MockHttpServletRequest()));

        assertEquals("Jeton d'authentification manquant.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec un en-tête sans préfixe Bearer lève une BadRequestException")
    void creerContrat_sansBearer_leveBadRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "valid-token");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dtoValide(), request));

        assertEquals("Jeton d'authentification manquant.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec un utilisateur connecté qui n'est pas gestionnaire lève une NotFoundException")
    void creerContrat_utilisateurPasGestionnaire_leveNotFound() {
        when(utilisateurRepository.findByEmail("admin@mail.com")).thenReturn(mock(Etudiant.class));

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));

        assertEquals("Gestionnaire non trouvé.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() avec un utilisateur inexistant lève une NotFoundException")
    void creerContrat_utilisateurInexistant_leveNotFound() {
        when(utilisateurRepository.findByEmail("admin@mail.com")).thenReturn(null);

        assertThrows(NotFoundException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));
    }


    @Test
    @DisplayName("creerContrat() avec un étudiant introuvable lève une NotFoundException")
    void creerContrat_etudiantIntrouvable_leveNotFound() {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));
    }

    @Test
    @DisplayName("creerContrat() avec un étudiant sans stage trouvé lève une BadRequestException")
    void creerContrat_statutNonTrouve_leveBadRequest() {
        when(etudiant.getStatutRecherche()).thenReturn(StatutRechercheEtudiant.LOOKING_FOR_INTERNSHIP);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));

        assertEquals("L'étudiant n'a pas le statut STAGE TROUVÉ.", ex.getMessage());
        verify(contratRepository, never()).save(any());
    }

    @Test
    @DisplayName("creerContrat() avec une offre non acceptée lève une NotFoundException")
    void creerContrat_offreNonAcceptee_leveNotFound() {
        when(applicationStageRepository.findByEtudiantId(1L)).thenReturn(List.of());

        assertThrows(NotFoundException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));
    }

    @Test
    @DisplayName("creerContrat() avec un contrat existant lève une ConflictException")
    void creerContrat_contratExistant_leveConflict() {
        when(contratRepository.existsByStudentIdAndInternshipOfferId(1L, 10L)).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));

        assertEquals("Un contrat actif existe déjà pour cet étudiant et cette offre.", ex.getMessage());
        verify(contratRepository, never()).save(any());
    }

    @Test
    @DisplayName("creerContrat() avec une offre sans employeur valide lève une NotFoundException")
    void creerContrat_offreSansEmployeur_leveNotFound() {
        when(offre.getEmployeur()).thenReturn(mock(Etudiant.class));

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.creerContrat(dtoValide(), requeteAvecToken()));

        assertEquals("Employeur lié à l'offre introuvable.", ex.getMessage());
    }

    @Test
    @DisplayName("creerContrat() sans professeur disponible crée quand même le contrat")
    void creerContrat_sansProfesseur_creeContrat() throws Exception {
        when(utilisateurRepository.findProfesseursByDiscipline(Disciplines.INFORMATIQUE))
                .thenReturn(List.of());

        contratService.creerContrat(dtoValide(), requeteAvecToken());

        ArgumentCaptor<Contract> captor = ArgumentCaptor.forClass(Contract.class);
        verify(contratRepository).save(captor.capture());
        assertNull(captor.getValue().getTeacher());
    }


    @Test
    @DisplayName("listerContrats() retourne tous les contrats")
    void listerContrats_retourneTousLesContrats() {
        Contract c1 = Contract.builder()
                .contractId(100L)
                .student(etudiant)
                .employer(employeur)
                .internshipOffer(offre)
                .contractStatus(StatutContrat.PENDING_SIGNATURE)
                .build();
        Contract c2 = Contract.builder()
                .contractId(101L)
                .student(etudiant)
                .employer(employeur)
                .internshipOffer(offre)
                .contractStatus(StatutContrat.PENDING_SIGNATURE)
                .build();
        when(contratRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of(c1, c2));

        List<ContratDTO> result = contratService.listerContrats();

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("listerContrats() sans contrat retourne une liste vide")
    void listerContrats_aucunContrat_listeVide() {
        when(contratRepository.findAllByOrderByDateCreationDesc()).thenReturn(List.of());

        assertTrue(contratService.listerContrats().isEmpty());
    }


    @Test
    @DisplayName("getContrat() avec un id existant retourne le contrat")
    void getContrat_existant_retourneDTO() throws Exception {
        Contract contract = Contract.builder()
                .contractId(100L)
                .student(etudiant)
                .employer(employeur)
                .internshipOffer(offre)
                .admin(gestionnaire)
                .supervisorName("Alice Tech")
                .startingDate(LocalDate.now().plusDays(10))
                .endingDate(LocalDate.now().plusMonths(3))
                .weeklyHours(35)
                .hourlySalary(22.5)
                .internshipLocation("123 rue Sherbrooke")
                .build();

        when(contratRepository.findById(100L)).thenReturn(Optional.of(contract));

        ContratDTO result = contratService.getContrat(100L);

        assertEquals(100L, result.id());
        assertEquals("Alice Tremblay", result.studentFullName());
        assertEquals("Microsoft", result.companyName());
        assertEquals("Développeur Java", result.offerTitle());
        assertEquals(StatutContrat.PENDING_SIGNATURE, result.contractStatus());
    }

    @Test
    @DisplayName("getContrat() avec un id inexistant lève une NotFoundException")
    void getContrat_inexistant_leveNotFound() {
        when(contratRepository.findById(404L)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> contratService.getContrat(404L));

        assertEquals("Contrat non trouvé ", ex.getMessage());
    }
}