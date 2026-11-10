package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.PreferenceNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferenceNotificationRepository extends JpaRepository<PreferenceNotification, Long> {
    Optional<PreferenceNotification> findByUtilisateurId(Long utilisateurId);
}