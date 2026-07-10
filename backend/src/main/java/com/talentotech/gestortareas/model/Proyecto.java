package com.talentotech.gestortareas.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Proyecto.
 *
 * Es el "contenedor" de Tareas. La relacion Proyecto -> Tarea es
 * OneToMany (del lado inverso), y Tarea -> Proyecto es ManyToOne
 * (varias tareas pueden ser del mismo proyecto).
 *
 * mappedBy = "proyecto" le dice a JPA que la columna de la relacion
 * (proyecto_id) vive en la tabla tareas, no en esta.
 */
@Entity
@Table(name = "proyectos")
public class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del proyecto es obligatorio")
    @Size(min = 2, max = 120, message = "El nombre debe tener entre 2 y 120 caracteres")
    @Column(nullable = false, length = 120)
    private String nombre;

    @Size(max = 500, message = "La descripcion no puede superar los 500 caracteres")
    @Column(length = 500)
    private String descripcion;

    // Ignoramos "proyecto" y "usuariosAsignados" al serializar las tareas
    // para no entrar en el loop infinito Proyecto -> Tarea -> Proyecto -> Tarea...
    @OneToMany(mappedBy = "proyecto", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"proyecto", "usuariosAsignados"})
    private Set<Tarea> tareas = new HashSet<>();

    // Que PM es dueño de este proyecto: define quien lo puede ver
    // (el PM y su equipo, ver ProyectoService.listarVisiblesPara) y
    // quien lo puede editar/borrar.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creado_por_id", nullable = false)
    @JsonIgnoreProperties({"tareas", "pmAsignado"})
    private Usuario creadoPor;

    public Proyecto() {
    }

    public Proyecto(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Set<Tarea> getTareas() {
        return tareas;
    }

    public void setTareas(Set<Tarea> tareas) {
        this.tareas = tareas;
    }

    public Usuario getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(Usuario creadoPor) {
        this.creadoPor = creadoPor;
    }
}
