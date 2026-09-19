package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.Utilisateur;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.repository.UtilisateurRepository;
import com.lacouf.rsbjwt.security.exception.AuthenticationException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider{
	private final PasswordEncoder passwordEncoder;
	private final UserAppRepository userAppRepository;
	private final UtilisateurRepository utilisateurRepository;

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(authentication.getPrincipal().toString());
		if (utilisateur == null || !passwordEncoder.matches(String.valueOf(authentication.getCredentials()), utilisateur.getPassword())) {
			throw new BadCredentialsException("Courriel ou mot de passe invalide");
		}
		return new UsernamePasswordAuthenticationToken(utilisateur.getEmail(), utilisateur.getPassword(), utilisateur.getAuthorities());
	}
	
	@Override
	public boolean supports(Class<?> authentication){
		return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
	}

	private UserApp loadUserByEmail(String email) throws UsernameNotFoundException{
		return userAppRepository.findUserAppByEmail(email)
			.orElseThrow(UserNotFoundException::new);
	}

	private void validateAuthentication(Authentication authentication, UserApp user){
		if(!passwordEncoder.matches(authentication.getCredentials().toString(), user.getPassword()))
			throw new AuthenticationException(HttpStatus.FORBIDDEN, "Incorrect username or password");
	}
}
