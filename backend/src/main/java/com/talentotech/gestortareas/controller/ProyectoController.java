package com.talentotech.gestortareas.controller;

import com.talentotech.gestortareas.model.Proyecto;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.service.ProyectoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de Proyecto. Expone el CRUD sobre /api/proyectos,
 * sin ninguna logica de negocio propia (esa complejidad esta
 * concentrada en TareaService).
 */
@RestController
@RequestMapping("/api/proyectos")
public class ProyectoController {

    private final ProyectoService proyectoService;

    public ProyectoController(ProyectoService proyectoService) {
        this.proyectoService = proyectoService;
    }

    @GetMapping
    public List<Proyecto> listar(@AuthenticationPrincipal Usuario actual) {
        return proyectoService.listarVisiblesPara(actual);
    }

    @GetMapping("/{id}")
    public Proyecto buscarPorId(@PathVariable Long id) {
        return proyectoService.buscarPorId(id);
    }

    // Restringido a PM/ADMIN en SecurityConfig.
    @PostMapping
    public ResponseEntity<Proyecto> crear(@Valid @RequestBody Proyecto proyecto, @AuthenticationPrincipal Usuario actual) {
        Proyecto creado = proyectoService.crear(proyecto, actual);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public Proyecto actualizar(@PathVariable Long id, @Valid @RequestBody Proyecto proyecto, @AuthenticationPrincipal Usuario actual) {
        return proyectoService.actualizar(id, proyecto, actual);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal Usuario actual) {
        proyectoService.eliminar(id, actual);
        return ResponseEntity.noContent().build();
    }
}
