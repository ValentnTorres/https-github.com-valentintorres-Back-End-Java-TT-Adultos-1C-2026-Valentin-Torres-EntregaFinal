package com.talentotech.gestortareas.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuracion global de CORS.
 *
 * El frontend (React con Vite) corre en un origen distinto al backend
 * (en local, http://localhost:5173 contra el backend en el 8080; en
 * produccion, dos dominios distintos, por ejemplo Vercel para el
 * frontend y Render para el backend). Sin esto, el navegador te
 * bloquea las llamadas fetch del frontend hacia la API por politica
 * de mismo origen.
 *
 * Se expone como CorsConfigurationSource (en vez de WebMvcConfigurer)
 * porque asi lo puede usar tambien SecurityConfig: el filtro de
 * Spring Security corre antes que el WebMvcConfigurer, asi que si el
 * CORS solo estuviera ahi, Security te bloquearia el preflight
 * (OPTIONS) antes de que llegue a aplicarse.
 */
@Configuration
public class CorsConfig {

    // URL publica del frontend en produccion (ver application.properties
    // / variable de entorno FRONTEND_URL). Vacio en local: no hace
    // falta, ya se permite localhost:5173 siempre.
    @Value("${frontend.url:}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origenesPermitidos = new ArrayList<>(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        if (!frontendUrl.isBlank()) {
            origenesPermitidos.add(frontendUrl);
        }

        CorsConfiguration configuracion = new CorsConfiguration();
        configuracion.setAllowedOrigins(origenesPermitidos);
        configuracion.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuracion.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuracion);
        return source;
    }
}
