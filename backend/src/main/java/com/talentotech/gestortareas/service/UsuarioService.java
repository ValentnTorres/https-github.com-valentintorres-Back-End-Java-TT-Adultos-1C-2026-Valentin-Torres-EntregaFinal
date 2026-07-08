package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.BusinessRuleException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de Usuario.
 *
 * Aca vive la logica de negocio, separada del controller (que solo
 * se encarga de exponer los endpoints HTTP) y del repository (que solo
 * se encarga de hablar con la base de datos).
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un usuario con id " + id));
    }

    public Usuario crear(Usuario usuario) {
        // Regla de negocio simple: no permitir dos usuarios con el mismo email.
        usuarioRepository.findByEmail(usuario.getEmail()).ifPresent(u -> {
            throw new BusinessRuleException("Ya existe un usuario con el email " + usuario.getEmail());
        });
        return usuarioRepository.save(usuario);
    }

    public Usuario actualizar(Long id, Usuario datosNuevos) {
        Usuario usuarioExistente = buscarPorId(id);
        usuarioExistente.setNombre(datosNuevos.getNombre());
        usuarioExistente.setEmail(datosNuevos.getEmail());
        return usuarioRepository.save(usuarioExistente);
    }

    public void eliminar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuarioRepository.delete(usuario);
    }
}
