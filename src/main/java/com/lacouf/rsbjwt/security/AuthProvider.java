package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider{
	private final PasswordEncoder passwordEncoder;
	private final UtilisateurRepository utilisateurRepository;
	private static final Logger logger = Logger.getLogger(AuthProvider.class.getName());

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(authentication.getPrincipal().toString());
		logger.info(utilisateur.toString());
		validateAuthentication(authentication, utilisateur);
		return new UsernamePasswordAuthenticationToken(utilisateur.getEmail(), utilisateur.getPassword(), utilisateur.getAuthorities());
	}
	
	@Override
	public boolean supports(Class<?> authentication){
		return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
	}

	private void validateAuthentication(Authentication authentication, Utilisateur user) {
		if (!passwordEncoder.matches(authentication.getCredentials().toString(), user.getPassword())) {
			throw new BadCredentialsException("Invalid credentials");
		}
	}
}




