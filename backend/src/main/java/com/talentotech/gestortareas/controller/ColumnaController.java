package com.talentotech.gestortareas.controller;

import com.talentotech.gestortareas.model.Columna;
import com.talentotech.gestortareas.service.ColumnaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de Columna. Ademas del CRUD sobre /api/columnas,
 * expone un endpoint aparte para reordenar todo el tablero de una,
 * cuando arrastras una columna a otra posicion.
 */
@RestController
@RequestMapping("/api/columnas")
public class ColumnaController {

    private final ColumnaService columnaService;

    public ColumnaController(ColumnaService columnaService) {
        this.columnaService = columnaService;
    }

    @GetMapping
    public List<Columna> listar() {
        return columnaService.listarTodas();
    }

    @PostMapping
    public ResponseEntity<Columna> crear(@Valid @RequestBody Columna columna) {
        Columna creada = columnaService.crear(columna);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    public Columna actualizar(@PathVariable Long id, @Valid @RequestBody Columna columna) {
        return columnaService.actualizar(id, columna);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        columnaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // Recibe la lista de ids de columna en el orden nuevo (de
    // izquierda a derecha) y te devuelve el tablero ya reordenado.
    @PutMapping("/reordenar")
    public List<Columna> reordenar(@RequestBody List<Long> idsEnOrden) {
        return columnaService.reordenar(idsEnOrden);
    }
}
