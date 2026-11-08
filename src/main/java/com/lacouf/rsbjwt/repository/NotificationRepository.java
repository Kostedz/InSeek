package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.TypeNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByTypeAndContratId(TypeNotification type, Long contratId);

    @Query("""
            SELECT n FROM Notification n
            WHERE n.destinataire.credentials.email = :email
            ORDER BY n.dateCreation DESC
            """)
    List<Notification> findByDestinataireEmail(@Param("email") String email);

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE n.destinataire.credentials.email = :email AND n.lue = false
            """)
    long countNonLuesByEmail(@Param("email") String email);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.contrat.id = :contratId AND n.type = :type")
    void marquerLuesPourContrat(@Param("contratId") Long contratId, @Param("type") TypeNotification type);
}