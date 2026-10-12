package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;
    private final UtilisateurRepository utilisateurRepository;

    @Value("${app.dev.enabled:false}")
    private boolean devEnabled;

    @Value("${app.dev.email:dev@inseek.local}")
    private String devEmail;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UtilisateurRepository utilisateurRepository) {
        this.tokenProvider = tokenProvider;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = getJWTFromRequest(request);
        if (StringUtils.hasText(token)) {
        	token = token.startsWith("Bearer") ? token.substring(7) : token;
            try {
                tokenProvider.validateToken(token);
                String email = tokenProvider.getEmailFromJWT(token);
                Utilisateur user = utilisateurRepository.findByEmail(email);
                Collection<? extends GrantedAuthority> authorities = authoritiesFor(email, user);
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        user.getEmail(), null, authorities
                );
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            } catch (Exception e) {
                logger.error("Could not set user authentication in security context", e);
            }
        }
        filterChain.doFilter(request, response);
    }

    private Collection<? extends GrantedAuthority> authoritiesFor(String email, Utilisateur user) {
        if (devEnabled && devEmail.equalsIgnoreCase(email)) {
            return Arrays.stream(Role.values())
                    .map(role -> new SimpleGrantedAuthority(role.name()))
                    .toList();
        }

        return user.getAuthorities();
    }

    private String getJWTFromRequest(HttpServletRequest request) {
        return request.getHeader("Authorization");
    }

}
