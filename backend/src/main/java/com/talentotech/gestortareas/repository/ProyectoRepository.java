package com.talentotech.gestortareas.repository;

import com.talentotech.gestortareas.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository de Proyecto. Igual que UsuarioRepository: con extender
 * JpaRepository ya te alcanza para el CRUD basico, no hace falta
 * escribir ningun metodo propio.
 */
public interface ProyectoRepository extends JpaRepository<Proyecto, Long> {
}
