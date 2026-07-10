package com.talentotech.gestortareas.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Tarea.
 *
 * Es el centro de las tres relaciones ManyToOne/ManyToMany del dominio:
 *  - ManyToOne con Proyecto: cada tarea pertenece a un unico proyecto.
 *  - ManyToOne con Columna: en que columna del tablero Kanban esta
 *    (reemplaza al viejo enum EstadoTarea por columnas que vos creas).
 *  - ManyToMany con Usuario: una tarea puede tener varios usuarios
 *    asignados, y un usuario puede tener varias tareas.
 *
 * Esta clase es el lado "dueño" del ManyToMany (la que tiene el
 * @JoinTable), asi que es la que define como se llama la tabla
 * intermedia y sus columnas.
 */
@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El titulo es obligatorio")
    @Size(min = 2, max = 150, message = "El titulo debe tener entre 2 y 150 caracteres")
    @Column(nullable = false, length = 150)
    private String titulo;

    @Size(max = 500, message = "La descripcion no puede superar los 500 caracteres")
    @Column(length = 500)
    private String descripcion;

    private LocalDate fechaLimite;

    // Relacion ManyToOne: en que columna del tablero esta esta tarea.
    // Columna no tiene una coleccion de vuelta hacia Tarea, asi que
    // aca no hace falta @JsonIgnoreProperties (no hay loop que cortar).
    @NotNull(message = "La tarea debe pertenecer a una columna")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "columna_id", nullable = false)
    private Columna columna;

    // Relacion ManyToOne: muchas tareas -> un proyecto.
    // @NotNull para que Hibernate Validator te obligue a que toda
    // tarea tenga un proyecto asociado al crearla.
    // Fetch EAGER (el default de @ManyToOne) porque siempre devolvemos
    // el proyecto junto con la tarea en la API; con LAZY, Jackson no
    // puede serializar el proxy de Hibernate y explota al armar el JSON.
    @NotNull(message = "La tarea debe pertenecer a un proyecto")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proyecto_id", nullable = false)
    @JsonIgnoreProperties({"tareas"})
    private Proyecto proyecto;

    // Relacion ManyToMany: lado dueño. Genera la tabla intermedia
    // "tarea_usuario" con las columnas tarea_id y usuario_id.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "tarea_usuario",
            joinColumns = @JoinColumn(name = "tarea_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    @JsonIgnoreProperties({"tareas"})
    private Set<Usuario> usuariosAsignados = new HashSet<>();

    public Tarea() {
    }

    public Tarea(String titulo, String descripcion, LocalDate fechaLimite, Proyecto proyecto, Columna columna) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.fechaLimite = fechaLimite;
        this.proyecto = proyecto;
        this.columna = columna;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Columna getColumna() {
        return columna;
    }

    public void setColumna(Columna columna) {
        this.columna = columna;
    }

    public LocalDate getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDate fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public Proyecto getProyecto() {
        return proyecto;
    }

    public void setProyecto(Proyecto proyecto) {
        this.proyecto = proyecto;
    }

    public Set<Usuario> getUsuariosAsignados() {
        return usuariosAsignados;
    }

    public void setUsuariosAsignados(Set<Usuario> usuariosAsignados) {
        this.usuariosAsignados = usuariosAsignados;
    }
}
