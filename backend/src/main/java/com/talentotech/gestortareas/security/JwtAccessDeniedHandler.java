package com.talentotech.gestortareas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentotech.gestortareas.exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

/**
 * Reemplaza la pagina de error HTML que trae Spring Security por
 * defecto cuando un usuario SI autenticado pero sin el rol necesario
 * (hasRole/hasAnyRole en SecurityConfig) pega contra una ruta
 * restringida. Es la contraparte de JwtAuthEntryPoint: ese es para
 * "no se quien sos" (401), este es para "se quien sos pero no podes" (403).
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public JwtAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Acceso denegado",
                List.of("Tu rol no tiene permiso para acceder a este recurso")
        );

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
