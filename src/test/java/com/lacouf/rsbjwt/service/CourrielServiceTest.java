package com.lacouf.rsbjwt.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourrielServiceTest {

    @Mock ObjectProvider<JavaMailSender> provider;
    @Mock JavaMailSender sender;

    @Test
    void envoieLeCourrielQuandLeMailEstConfigure() {
        when(provider.getIfAvailable()).thenReturn(sender);
        CourrielService service = new CourrielService(provider, "no-reply@inseek.local");

        service.envoyer("a@b.com", "Sujet", "Corps");

        verify(sender).send(any(SimpleMailMessage.class));
    }

    @Test
    void ecritDansLesLogsQuandLeMailNEstPasConfigure() {
        when(provider.getIfAvailable()).thenReturn(null);
        CourrielService service = new CourrielService(provider, "no-reply@inseek.local");

        assertDoesNotThrow(() -> service.envoyer("a@b.com", "Sujet", "Corps"));
        verifyNoInteractions(sender);
    }

    @Test
    void neLancePasDExceptionSiLEnvoiEchoue() {
        when(provider.getIfAvailable()).thenReturn(sender);
        doThrow(new MailSendException("panne")).when(sender).send(any(SimpleMailMessage.class));
        CourrielService service = new CourrielService(provider, "no-reply@inseek.local");

        assertDoesNotThrow(() -> service.envoyer("a@b.com", "Sujet", "Corps"));
    }
}