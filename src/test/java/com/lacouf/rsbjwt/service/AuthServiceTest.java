package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("validateJwt() avec un token valide retourne true")
    void validateJwt_tokenValide_retourneTrue() {
        when(request.getHeader("Authorization"))
                .thenReturn("Bearer valid-token");

        when(jwtTokenProvider.isTokenValid("valid-token"))
                .thenReturn(true);

        assertTrue(authService.validateJwt(request));
    }

    @Test
    @DisplayName("validateJwt() sans header Authorization retourne false")
    void validateJwt_sansHeader_retourneFalse() {
        when(request.getHeader("Authorization"))
                .thenReturn(null);

        assertFalse(authService.validateJwt(request));
    }

    @Test
    @DisplayName("validateJwt() avec un header sans préfixe Bearer retourne false")
    void validateJwt_headerSansBearer_retourneFalse() {
        when(request.getHeader("Authorization"))
                .thenReturn("Basic abc123");

        assertFalse(authService.validateJwt(request));
    }

    @Test
    @DisplayName("validateJwt() avec un token invalide retourne false")
    void validateJwt_tokenInvalide_retourneFalse() {
        when(request.getHeader("Authorization"))
                .thenReturn("Bearer invalid-token");

        when(jwtTokenProvider.isTokenValid("invalid-token"))
                .thenReturn(false);

        assertFalse(authService.validateJwt(request));
    }
}