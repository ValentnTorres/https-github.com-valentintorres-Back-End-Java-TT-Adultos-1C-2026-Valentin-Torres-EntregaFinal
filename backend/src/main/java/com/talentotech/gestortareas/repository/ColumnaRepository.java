package com.talentotech.gestortareas.repository;

import com.talentotech.gestortareas.model.Columna;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository de Columna.
 */
public interface ColumnaRepository extends JpaRepository<Columna, Long> {

    // Trae las columnas ya ordenadas tal cual se ven en el tablero.
    List<Columna> findAllByOrderByOrdenAsc();
}
