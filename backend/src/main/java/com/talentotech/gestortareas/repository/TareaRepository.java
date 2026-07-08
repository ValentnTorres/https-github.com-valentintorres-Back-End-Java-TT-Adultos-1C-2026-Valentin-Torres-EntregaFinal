package com.talentotech.gestortareas.repository;

import com.talentotech.gestortareas.model.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository de Tarea.
 */
public interface TareaRepository extends JpaRepository<Tarea, Long> {

    // Metodo derivado para traer todas las tareas de un proyecto puntual.
    List<Tarea> findByProyectoId(Long proyectoId);

    // Usado por ColumnaService para saber si una columna tiene tareas
    // antes de dejarla borrar.
    long countByColumnaId(Long columnaId);
}
