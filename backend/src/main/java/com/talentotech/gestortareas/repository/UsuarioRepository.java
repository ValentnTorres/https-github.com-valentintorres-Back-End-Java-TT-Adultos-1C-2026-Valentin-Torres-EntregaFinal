package com.talentotech.gestortareas.repository;

import com.talentotech.gestortareas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository de Usuario.
 *
 * Al extender JpaRepository ya tenemos gratis los metodos basicos
 * (save, findById, findAll, deleteById, etc). Spring Data JPA genera
 * la implementacion en tiempo de ejecucion, no hace falta escribir
 * ninguna clase concreta.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Metodo derivado: Spring Data JPA arma la consulta SQL solo
    // leyendo el nombre del metodo (SELECT * FROM usuarios WHERE email = ?).
    Optional<Usuario> findByEmail(String email);
}
