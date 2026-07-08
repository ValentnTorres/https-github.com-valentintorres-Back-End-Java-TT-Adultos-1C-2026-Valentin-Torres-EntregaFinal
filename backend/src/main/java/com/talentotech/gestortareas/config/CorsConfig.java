package com.talentotech.gestortareas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuracion global de CORS.
 *
 * El frontend (React con Vite) corre en un puerto distinto al backend
 * (por ejemplo http://localhost:5173, mientras el backend corre en el
 * 8080). Sin esto, el navegador bloquea las llamadas fetch del
 * frontend hacia la API por politica de mismo origen.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
