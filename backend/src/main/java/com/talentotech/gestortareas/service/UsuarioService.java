package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.BusinessRuleException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Rol;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.TareaRepository;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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
        // El alta es publica (POST /api/usuarios sin auth, ver SecurityConfig):
        // forzamos rol USER y sin PM asignado sin importar que mande el body,
        // para que nadie se autoasigne ADMIN/PM registrandose.
        usuario.setRol(Rol.USER);
        usuario.setPmAsignado(null);
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

    // Solo la llama el controller bajo PUT /usuarios/{id}/rol, restringido
    // a ADMIN en SecurityConfig. Si un PM deja de serlo, sus proyectos
    // existentes no se tocan (quedan "huerfanos" de un PM que ya no es
    // PM - caso aceptado, no hace falta reasignarlos).
    public Usuario cambiarRol(Long usuarioId, Rol nuevoRol) {
        Usuario usuario = buscarPorId(usuarioId);
        usuario.setRol(nuevoRol);
        return usuarioRepository.save(usuario);
    }

    // Solo la llama el controller bajo PUT /usuarios/{id}/pm, restringido
    // a ADMIN. Asigna a un USER el PM cuyo equipo va a integrar.
    public Usuario asignarAPm(Long usuarioId, Long pmId) {
        Usuario usuario = buscarPorId(usuarioId);
        Usuario pm = buscarPorId(pmId);
        if (pm.getRol() != Rol.PM) {
            throw new BusinessRuleException("El usuario indicado como PM no tiene rol PM");
        }
        usuario.setPmAsignado(pm);
        return usuarioRepository.save(usuario);
    }

    /**
     * Lista de usuarios "visibles" para armar el selector de asignacion de
     * tareas, segun el rol del que pregunta:
     *  - ADMIN: todos.
     *  - PM: su equipo (los usuarios que le asigno el ADMIN) mas el mismo.
     *  - USER: sus compañeros de equipo (mismo PM asignado) mas ese PM.
     */
    public List<Usuario> listarEquipoDe(Usuario actual) {
        if (actual.getRol() == Rol.ADMIN) {
            return usuarioRepository.findAll();
        }

        if (actual.getRol() == Rol.PM) {
            List<Usuario> equipo = usuarioRepository.findAll().stream()
                    .filter(u -> u.getPmAsignado() != null && u.getPmAsignado().getId().equals(actual.getId()))
                    .collect(Collectors.toList());
            equipo.add(actual);
            return equipo;
        }

        // USER sin PM asignado todavia: no tiene equipo.
        if (actual.getPmAsignado() == null) {
            return List.of();
        }
        Long pmId = actual.getPmAsignado().getId();
        List<Usuario> equipo = usuarioRepository.findAll().stream()
                .filter(u -> u.getPmAsignado() != null && u.getPmAsignado().getId().equals(pmId))
                .collect(Collectors.toList());
        equipo.add(actual.getPmAsignado());
        return equipo;
    }
}
