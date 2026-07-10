package com.talentotech.gestortareas.controller;

import com.talentotech.gestortareas.model.Tarea;
import com.talentotech.gestortareas.service.TareaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de Tarea.
 *
 * Ademas del CRUD sobre /api/tareas, expone dos endpoints mas para
 * manejar la relacion ManyToMany con Usuario: asignar y desasignar.
 */
@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    private final TareaService tareaService;

    public TareaController(TareaService tareaService) {
        this.tareaService = tareaService;
    }

    @GetMapping
    public List<Tarea> listar() {
        return tareaService.listarTodas();
    }

    @GetMapping("/{id}")
    public Tarea buscarPorId(@PathVariable Long id) {
        return tareaService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<Tarea> crear(@Valid @RequestBody Tarea tarea) {
        Tarea creada = tareaService.crear(tarea);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    public Tarea actualizar(@PathVariable Long id, @Valid @RequestBody Tarea tarea) {
        return tareaService.actualizar(id, tarea);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        tareaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // Asigna un usuario existente a una tarea existente (crea la fila
    // nueva en la tabla intermedia tarea_usuario).
    @PostMapping("/{tareaId}/usuarios/{usuarioId}")
    public Tarea asignarUsuario(@PathVariable Long tareaId, @PathVariable Long usuarioId) {
        return tareaService.asignarUsuario(tareaId, usuarioId);
    }

    // Desasigna un usuario de una tarea (le borra la fila de la tabla intermedia).
    @DeleteMapping("/{tareaId}/usuarios/{usuarioId}")
    public Tarea desasignarUsuario(@PathVariable Long tareaId, @PathVariable Long usuarioId) {
        return tareaService.desasignarUsuario(tareaId, usuarioId);
    }
}
