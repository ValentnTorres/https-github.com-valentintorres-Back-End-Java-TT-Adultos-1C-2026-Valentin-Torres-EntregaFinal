package com.talentotech.gestortareas.service;

import com.talentotech.gestortareas.exception.AccesoDenegadoException;
import com.talentotech.gestortareas.exception.ResourceNotFoundException;
import com.talentotech.gestortareas.model.Proyecto;
import com.talentotech.gestortareas.model.Rol;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.ProyectoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de Proyecto.
 *
 * La visibilidad de un proyecto depende del rol de quien pregunta (ver
 * listarVisiblesPara): un ADMIN ve todos, un PM solo los que el mismo
 * creo, y un USER solo los del PM al que el ADMIN lo asigno.
 */
@Service
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;

    public ProyectoService(ProyectoRepository proyectoRepository) {
        this.proyectoRepository = proyectoRepository;
    }

    public List<Proyecto> listarVisiblesPara(Usuario actual) {
        if (actual.getRol() == Rol.ADMIN) {
            return proyectoRepository.findAll();
        }
        if (actual.getRol() == Rol.PM) {
            return proyectoRepository.findByCreadoPorId(actual.getId());
        }
        // USER: los proyectos de su PM asignado (ninguno si todavia no
        // le asignaron uno).
        if (actual.getPmAsignado() == null) {
            return List.of();
        }
        return proyectoRepository.findByCreadoPorId(actual.getPmAsignado().getId());
    }

    public Proyecto buscarPorId(Long id) {
        return proyectoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un proyecto con id " + id));
    }

    public Proyecto crear(Proyecto proyecto, Usuario actual) {
        proyecto.setCreadoPor(actual);
        return proyectoRepository.save(proyecto);
    }

    public Proyecto actualizar(Long id, Proyecto datosNuevos, Usuario actual) {
        Proyecto proyectoExistente = buscarPorId(id);
        exigirPropietario(proyectoExistente, actual);
        proyectoExistente.setNombre(datosNuevos.getNombre());
        proyectoExistente.setDescripcion(datosNuevos.getDescripcion());
        return proyectoRepository.save(proyectoExistente);
    }

    public void eliminar(Long id, Usuario actual) {
        Proyecto proyecto = buscarPorId(id);
        exigirPropietario(proyecto, actual);
        proyectoRepository.delete(proyecto);
    }

    // Un ADMIN puede editar/borrar cualquier proyecto; un PM solo los
    // propios (no el de otro PM).
    private void exigirPropietario(Proyecto proyecto, Usuario actual) {
        if (actual.getRol() == Rol.ADMIN) {
            return;
        }
        if (!proyecto.getCreadoPor().getId().equals(actual.getId())) {
            throw new AccesoDenegadoException("No podes modificar un proyecto que no creaste vos");
        }
    }
}
