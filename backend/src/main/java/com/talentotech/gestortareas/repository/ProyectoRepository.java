package com.talentotech.gestortareas.repository;

import com.talentotech.gestortareas.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository de Proyecto.
 */
public interface ProyectoRepository extends JpaRepository<Proyecto, Long> {

    // Usado por ProyectoService.listarVisiblesPara(): los proyectos que
    // creo un PM puntual (o los de un USER, buscando por el id de su PM
    // asignado).
    List<Proyecto> findByCreadoPorId(Long creadoPorId);
}
