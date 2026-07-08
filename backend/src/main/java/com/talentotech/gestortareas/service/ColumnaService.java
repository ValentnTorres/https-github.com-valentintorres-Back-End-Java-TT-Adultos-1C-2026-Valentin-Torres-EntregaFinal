package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.BusinessRuleException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Columna;
import com.talentotech.gestortareas.repository.ColumnaRepository;
import com.talentotech.gestortareas.repository.TareaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service de Columna: las columnas del tablero Kanban (equivalentes a
 * las "listas" de Trello). A diferencia de Proyecto y Usuario, ademas
 * del CRUD tiene dos reglas propias:
 *  - no se puede borrar una columna que todavia tiene tareas;
 *  - reordenar el tablero completo, recalculando la posicion de cada columna.
 */
@Service
public class ColumnaService {

    private final ColumnaRepository columnaRepository;
    private final TareaRepository tareaRepository;

    public ColumnaService(ColumnaRepository columnaRepository, TareaRepository tareaRepository) {
        this.columnaRepository = columnaRepository;
        this.tareaRepository = tareaRepository;
    }

    public List<Columna> listarTodas() {
        return columnaRepository.findAllByOrderByOrdenAsc();
    }

    public Columna buscarPorId(Long id) {
        return columnaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una columna con id " + id));
    }

    // Una columna nueva siempre se agrega al final del tablero (a la
    // derecha de todas las demas), sin importar que "orden" haya
    // mandado el cliente: evita huecos o numeros duplicados.
    public Columna crear(Columna columna) {
        int siguienteOrden = columnaRepository.findAllByOrderByOrdenAsc().stream()
                .mapToInt(Columna::getOrden)
                .max()
                .orElse(-1) + 1;
        columna.setOrden(siguienteOrden);
        return columnaRepository.save(columna);
    }

    public Columna actualizar(Long id, Columna datosNuevos) {
        Columna existente = buscarPorId(id);
        existente.setNombre(datosNuevos.getNombre());
        existente.setEsFinal(datosNuevos.isEsFinal());
        return columnaRepository.save(existente);
    }

    public void eliminar(Long id) {
        Columna columna = buscarPorId(id);
        if (tareaRepository.countByColumnaId(id) > 0) {
            throw new BusinessRuleException("No se puede eliminar una columna que todavia tiene tareas");
        }
        columnaRepository.delete(columna);
    }

    // Recibe los ids de todas las columnas en el nuevo orden (de
    // izquierda a derecha) y reasigna el campo "orden" de cada una
    // segun su posicion en esa lista.
    public List<Columna> reordenar(List<Long> idsEnOrden) {
        List<Columna> resultado = new ArrayList<>();
        for (int posicion = 0; posicion < idsEnOrden.size(); posicion++) {
            Columna columna = buscarPorId(idsEnOrden.get(posicion));
            columna.setOrden(posicion);
            resultado.add(columnaRepository.save(columna));
        }
        return resultado;
    }
}
