package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Entrevue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Employeur employer;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Etudiant student;

    @ManyToOne
    @JoinColumn(nullable = false)
    private OffreDeStage internshipOffer;

    @Column(nullable = false)
    private LocalDateTime dateInterview;

    @Column(nullable = false)
    private String locationOrLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModeEntrevue modeInterview;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutConvocationEntrevue interviewInvitationStatus = StatutConvocationEntrevue.PENDING;

    private LocalDateTime invitationResponseDate;

    @Column(length = 1000)
    private String messageWhenRejected;

    @Builder
    public Entrevue(OffreDeStage internshipOffer, ModeEntrevue modeInterview, Employeur employer, Etudiant student, LocalDateTime dateInterview, String locationOrLink,  String message) {
        this.internshipOffer = internshipOffer;
        this.modeInterview = modeInterview;
        this.employer = employer;
        this.student = student;
        this.dateInterview = dateInterview;
        this.locationOrLink = locationOrLink;
        this.message = message;
    }
}
