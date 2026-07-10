package com.talentotech.gestortareas.config;

import com.talentotech.gestortareas.model.Columna;
import com.talentotech.gestortareas.repository.ColumnaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Crea las 3 columnas por defecto (Pendiente / En progreso / Completada)
 * la primera vez que la app arranca contra una base vacia, para que el
 * tablero no te arranque sin ninguna columna. Si ya hay columnas
 * cargadas (por ejemplo porque ya creaste/borraste las tuyas), no hace
 * nada.
 */
@Configuration
public class DatosInicialesConfig {

    @Bean
    public CommandLineRunner columnasPorDefecto(ColumnaRepository columnaRepository) {
        return args -> {
            if (columnaRepository.count() == 0) {
                columnaRepository.save(new Columna("Pendiente", 0, false));
                columnaRepository.save(new Columna("En progreso", 1, false));
                columnaRepository.save(new Columna("Completada", 2, true));
            }
        };
    }
}
