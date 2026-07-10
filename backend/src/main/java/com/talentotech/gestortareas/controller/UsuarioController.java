package com.talentotech.gestortareas.controller;

import com.talentotech.gestortareas.dto.AsignarPmRequest;
import com.talentotech.gestortareas.dto.CambiarRolRequest;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de Usuario.
 *
 * Expone el CRUD sobre /api/usuarios. No tiene logica de negocio
 * propia: solo recibe la request, valida el body (@Valid) y le pasa
 * el trabajo a UsuarioService.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    // Cualquier rol autenticado puede pedir esto (lo usa el selector de
    // "asignar a una tarea" en el frontend); el filtrado por rol lo hace
    // el service, no una restriccion de SecurityConfig.
    @GetMapping("/equipo")
    public List<Usuario> equipo(@AuthenticationPrincipal Usuario actual) {
        return usuarioService.listarEquipoDe(actual);
    }

    @GetMapping("/{id}")
    public Usuario buscarPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<Usuario> crear(@Valid @RequestBody Usuario usuario) {
        Usuario creado = usuarioService.crear(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public Usuario actualizar(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        return usuarioService.actualizar(id, usuario);
    }

    // Restringido a ADMIN en SecurityConfig.
    @PutMapping("/{id}/rol")
    public Usuario cambiarRol(@PathVariable Long id, @Valid @RequestBody CambiarRolRequest request) {
        return usuarioService.cambiarRol(id, request.rol());
    }

    // Restringido a ADMIN en SecurityConfig.
    @PutMapping("/{id}/pm")
    public Usuario asignarAPm(@PathVariable Long id, @Valid @RequestBody AsignarPmRequest request) {
        return usuarioService.asignarAPm(id, request.pmId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
