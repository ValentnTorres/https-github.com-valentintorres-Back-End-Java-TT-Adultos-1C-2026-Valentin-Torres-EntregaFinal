package com.talentotech.gestortareas.security;

import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Se ejecuta una vez por cada request. Si viene un header
 * "Authorization: Bearer <token>" valido, deja al usuario autenticado
 * en el SecurityContext para el resto del pipeline. Si no viene o es
 * invalido, no hace nada: deja pasar la request sin autenticar, y es
 * SecurityConfig el que decide despues si esa ruta necesita auth o no.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring("Bearer ".length());
            String email = jwtUtil.validarYExtraerEmail(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                usuarioRepository.findByEmail(email).ifPresent(this::autenticar);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void autenticar(Usuario usuario) {
        // El prefijo "ROLE_" es una convencion de Spring Security: hasRole("ADMIN")
        // internamente busca una authority llamada "ROLE_ADMIN".
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol()));
        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
