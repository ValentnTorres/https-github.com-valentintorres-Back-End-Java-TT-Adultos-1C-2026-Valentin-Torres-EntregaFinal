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

    // Lo usa ColumnaService para saber si una columna todavia tiene
    // tareas antes de dejarte borrarla.
    long countByColumnaId(Long columnaId);

    // Lo usa UsuarioService para saber si un usuario sigue asignado a
    // alguna tarea antes de dejarte borrarlo (mismo criterio que
    // countByColumnaId, pero atravesando la relacion ManyToMany).
    long countByUsuariosAsignadosId(Long usuarioId);
}
