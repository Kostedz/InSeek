package com.lacouf.rsbjwt.repository;


import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.recipient.credentials.email = :recipientEmail")
    List<Notification> findByRecipientEmail(String recipientEmail);

    void deleteByIdAndRecipient(long id, Utilisateur recipient);
}
