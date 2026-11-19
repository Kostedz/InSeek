package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireIdOrderByCreatedAtDesc(Long destinataireId);

    List<Notification> findByDestinataireIdAndLueFalseOrderByCreatedAtDesc(Long destinataireId);

    Optional<Notification> findFirstByDestinataireIdAndLienDirectAndLueFalseOrderByCreatedAtDesc(
            Long destinataireId, String lienDirect);
}