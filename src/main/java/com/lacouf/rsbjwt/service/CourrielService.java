package com.lacouf.rsbjwt.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CourrielService {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;

    public CourrielService(ObjectProvider<JavaMailSender> mailSender,
                           @Value("${app.mail.from:no-reply@inseek.local}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void envoyer(String to, String sujet, String corps) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("[COURRIEL non configuré] à={} sujet={}\n{}", to, sujet, corps);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(sujet);
            message.setText(corps);
            sender.send(message);
        } catch (Exception e) {
            log.error("Échec d'envoi du courriel à {}", to, e);
        }
    }
}