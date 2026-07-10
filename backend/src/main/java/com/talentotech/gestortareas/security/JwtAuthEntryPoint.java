package com.talentotech.gestortareas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentotech.gestortareas.exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

/**
 * Reemplaza la pagina de error HTML que trae Spring Security por
 * defecto cuando una request sin token (o con token invalido) llega a
 * una ruta protegida. Devuelve el mismo formato ErrorResponse que usa
 * GlobalExceptionHandler, para que el frontend (apiFetch) lo parsee
 * igual que a cualquier otro error de la API.
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "No autenticado",
                List.of("Falta un token valido para acceder a este recurso")
        );

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
