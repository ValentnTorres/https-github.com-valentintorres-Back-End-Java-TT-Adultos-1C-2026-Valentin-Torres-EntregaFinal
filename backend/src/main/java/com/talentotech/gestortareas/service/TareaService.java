package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.BusinessRuleException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Columna;
import com.talentotech.gestortareas.model.Proyecto;
import com.talentotech.gestortareas.model.Tarea;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.TareaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de Tarea.
 *
 * Es el service mas importante del proyecto: ademas del CRUD, maneja
 * la relacion ManyToMany con Usuario (asignar/desasignar) y aplica
 * las validaciones de negocio pedidas por la consigna del nivel avanzado.
 */
@Service
public class TareaService {

    private final TareaRepository tareaRepository;
    private final ProyectoService proyectoService;
    private final UsuarioService usuarioService;
    private final ColumnaService columnaService;

    public TareaService(
            TareaRepository tareaRepository,
            ProyectoService proyectoService,
            UsuarioService usuarioService,
            ColumnaService columnaService
    ) {
        this.tareaRepository = tareaRepository;
        this.proyectoService = proyectoService;
        this.usuarioService = usuarioService;
        this.columnaService = columnaService;
    }

    public List<Tarea> listarTodas() {
        return tareaRepository.findAll();
    }

    public Tarea buscarPorId(Long id) {
        return tareaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una tarea con id " + id));
    }

    public Tarea crear(Tarea tarea) {
        // Verificamos que el proyecto y la columna indicados existan
        // antes de guardar la tarea.
        Proyecto proyecto = proyectoService.buscarPorId(tarea.getProyecto().getId());
        Columna columna = columnaService.buscarPorId(tarea.getColumna().getId());
        tarea.setProyecto(proyecto);
        tarea.setColumna(columna);
        return tareaRepository.save(tarea);
    }

    public Tarea actualizar(Long id, Tarea datosNuevos) {
        Tarea tareaExistente = buscarPorId(id);
        tareaExistente.setTitulo(datosNuevos.getTitulo());
        tareaExistente.setDescripcion(datosNuevos.getDescripcion());
        tareaExistente.setFechaLimite(datosNuevos.getFechaLimite());

        if (datosNuevos.getProyecto() != null && datosNuevos.getProyecto().getId() != null) {
            Proyecto proyecto = proyectoService.buscarPorId(datosNuevos.getProyecto().getId());
            tareaExistente.setProyecto(proyecto);
        }

        if (datosNuevos.getColumna() != null && datosNuevos.getColumna().getId() != null) {
            Columna columna = columnaService.buscarPorId(datosNuevos.getColumna().getId());
            tareaExistente.setColumna(columna);
        }

        return tareaRepository.save(tareaExistente);
    }

    public void eliminar(Long id) {
        Tarea tarea = buscarPorId(id);
        tareaRepository.delete(tarea);
    }

    /**
     * Asigna un usuario a una tarea (relacion ManyToMany).
     *
     * Reglas de negocio validadas antes de guardar:
     *  1) No se puede asignar un usuario a una tarea que esta en una
     *     columna marcada como final (por ejemplo, "Completada").
     *  2) No se puede asignar el mismo usuario dos veces a la misma tarea.
     */
    public Tarea asignarUsuario(Long tareaId, Long usuarioId) {
        Tarea tarea = buscarPorId(tareaId);
        Usuario usuario = usuarioService.buscarPorId(usuarioId);

        if (tarea.getColumna().isEsFinal()) {
            throw new BusinessRuleException(
                    "No se puede asignar un usuario a una tarea en la columna \"" + tarea.getColumna().getNombre() + "\""
            );
        }

        // Comparamos por id (no por equals/hashCode default, que compara
        // por referencia) para saber si el usuario ya estaba asignado.
        boolean yaAsignado = tarea.getUsuariosAsignados().stream()
                .anyMatch(u -> u.getId().equals(usuarioId));
        if (yaAsignado) {
            throw new BusinessRuleException("El usuario ya esta asignado a esta tarea");
        }

        tarea.getUsuariosAsignados().add(usuario);
        return tareaRepository.save(tarea);
    }

    /**
     * Desasigna un usuario de una tarea (elimina la fila de la tabla
     * intermedia tarea_usuario).
     */
    public Tarea desasignarUsuario(Long tareaId, Long usuarioId) {
        Tarea tarea = buscarPorId(tareaId);
        usuarioService.buscarPorId(usuarioId);

        boolean eliminado = tarea.getUsuariosAsignados().removeIf(u -> u.getId().equals(usuarioId));
        if (!eliminado) {
            throw new BusinessRuleException("El usuario no esta asignado a esta tarea");
        }

        return tareaRepository.save(tarea);
    }
}
