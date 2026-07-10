package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Proyecto;
import com.talentotech.gestortareas.repository.ProyectoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de Proyecto. CRUD basico, sin reglas de negocio propias:
 * toda la complejidad de este dominio esta concentrada en TareaService.
 */
@Service
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;

    public ProyectoService(ProyectoRepository proyectoRepository) {
        this.proyectoRepository = proyectoRepository;
    }

    public List<Proyecto> listarTodos() {
        return proyectoRepository.findAll();
    }

    public Proyecto buscarPorId(Long id) {
        return proyectoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un proyecto con id " + id));
    }

    public Proyecto crear(Proyecto proyecto) {
        return proyectoRepository.save(proyecto);
    }

    public Proyecto actualizar(Long id, Proyecto datosNuevos) {
        Proyecto proyectoExistente = buscarPorId(id);
        proyectoExistente.setNombre(datosNuevos.getNombre());
        proyectoExistente.setDescripcion(datosNuevos.getDescripcion());
        return proyectoRepository.save(proyectoExistente);
    }

    public void eliminar(Long id) {
        Proyecto proyecto = buscarPorId(id);
        proyectoRepository.delete(proyecto);
    }
}
