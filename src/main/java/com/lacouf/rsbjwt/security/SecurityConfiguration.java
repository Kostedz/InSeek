    package com.lacouf.rsbjwt.security;

    import com.lacouf.rsbjwt.model.auth.Role;
    import com.lacouf.rsbjwt.repository.UtilisateurRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.core.Ordered;
    import org.springframework.core.annotation.Order;
    import org.springframework.http.HttpMethod;
    import org.springframework.security.authentication.AuthenticationManager;
    import org.springframework.security.config.Customizer;
    import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
    import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
    import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
    import org.springframework.security.config.http.SessionCreationPolicy;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.security.web.SecurityFilterChain;
    import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
    import org.springframework.web.cors.CorsConfiguration;
    import org.springframework.web.cors.CorsConfigurationSource;
    import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
    import org.springframework.web.filter.CorsFilter;

    import java.util.Arrays;
    import java.util.List;

import static org.springframework.http.HttpMethod.*;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    @Value("${app.dev.enabled:false}")
    private boolean devEnabled;

    private static final String H2_CONSOLE_PATH = "/h2-console/**";
    private static final String USER_LOGIN_PATH = "/user/login";
    private static final String USER_REGISTER_PATH = "/user/register";
    private static final String DEV_LOGIN_PATH = "/user/dev/login";
    private static final String DEV_STUDENT_DEMO_PATH = "/user/dev/student-demo";
    private static final String USER_PATH = "/user/**";
    private static final String ETUDIANT_PATH = "/etudiant/**";
    private static final String PROFESSEUR_PATH = "/professeur/**";
    private static final String GESTIONNAIRE_PATH = "/gestionnaire/**";


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, UtilisateurRepository utilisateurRepository) throws Exception {
        String[] documentUploadRoles = devEnabled
                ? new String[]{Role.ETUDIANT.name(), Role.EMPLOYEUR.name(), Role.GESTIONNAIRE.name()}
                : new String[]{Role.ETUDIANT.name(), Role.EMPLOYEUR.name()};
        String[] employerWriteRoles = devEnabled
                ? new String[]{Role.EMPLOYEUR.name(), Role.GESTIONNAIRE.name()}
                : new String[]{Role.EMPLOYEUR.name()};

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(POST, USER_LOGIN_PATH).permitAll()
                        .requestMatchers(POST, USER_REGISTER_PATH).permitAll()
                        .requestMatchers(POST, DEV_LOGIN_PATH).permitAll()
                        .requestMatchers(POST, DEV_STUDENT_DEMO_PATH).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(H2_CONSOLE_PATH).permitAll()


                        .requestMatchers(GET, USER_PATH).hasAnyAuthority(Role.EMPRUNTEUR.name(), Role.PREPOSE.name(), Role.GESTIONNAIRE.name(), Role.ETUDIANT.name(), Role.EMPLOYEUR.name(), Role.PROFESSEUR.name())
                        .requestMatchers(ETUDIANT_PATH).hasAuthority(Role.ETUDIANT.name())
                        .requestMatchers(POST, "/documents/upload").hasAnyAuthority(documentUploadRoles)
                        .requestMatchers(GET, "/employeur/offres").permitAll()
                        .requestMatchers(PUT, "/employeur/offres/**").hasAnyAuthority(employerWriteRoles)
                        .requestMatchers(PROFESSEUR_PATH).hasAuthority(Role.PROFESSEUR.name())
                        .requestMatchers(GESTIONNAIRE_PATH).hasAuthority(Role.GESTIONNAIRE.name())
                        .anyRequest().authenticated()
                )
                .headers(headers -> headers.frameOptions(Customizer.withDefaults()).disable())
                .sessionManagement((secuManagement) -> {
                    secuManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                })
                .addFilterBefore(jwtAuthenticationFilter(utilisateurRepository), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(configurer -> configurer.authenticationEntryPoint(authenticationEntryPoint));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

        configuration.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
        ));

        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Cache-Control",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "*"

        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all paths /**
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(UtilisateurRepository utilisateurRepository) throws Exception {
        return new JwtAuthenticationFilter(jwtTokenProvider, utilisateurRepository);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}