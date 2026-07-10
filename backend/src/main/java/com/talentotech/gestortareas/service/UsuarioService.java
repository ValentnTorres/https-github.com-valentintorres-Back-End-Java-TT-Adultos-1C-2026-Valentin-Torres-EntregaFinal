package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.BusinessRuleException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.TareaRepository;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de Usuario.
 *
 * Aca vive la logica de negocio, separada del controller (que solo se
 * encarga de exponer los endpoints HTTP) y del repository (que solo se
 * encarga de hablar con la base de datos).
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TareaRepository tareaRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, TareaRepository tareaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tareaRepository = tareaRepository;
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
        // La contraseña no lleva @NotBlank/@Size en la entidad (ver
        // Usuario.java) porque el PUT de edicion reutiliza la misma
        // clase sin mandarla, asi que la validamos a mano solo aca, en
        // el alta.
        if (usuario.getPassword() == null || usuario.getPassword().isBlank()) {
            throw new BusinessRuleException("La contraseña es obligatoria");
        }
        if (usuario.getPassword().length() < 6) {
            throw new BusinessRuleException("La contraseña debe tener al menos 6 caracteres");
        }
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
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
        // Mismo criterio que ColumnaService: si no se chequea esto antes,
        // el DELETE explota con una violacion de foreign key de MySQL
        // (el usuario sigue referenciado desde tarea_usuario) y el error
        // SQL crudo termina mostrandose tal cual en el frontend.
        if (tareaRepository.countByUsuariosAsignadosId(id) > 0) {
            throw new BusinessRuleException("No se puede eliminar un usuario que todavia esta asignado a alguna tarea");
        }
        usuarioRepository.delete(usuario);
    }
}
