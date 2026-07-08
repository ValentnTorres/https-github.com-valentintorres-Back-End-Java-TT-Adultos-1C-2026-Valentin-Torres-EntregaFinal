package com.talentotech.gestortareas.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Usuario.
 *
 * Representa a una persona que puede ser asignada a una o mas Tareas.
 * La relacion con Tarea es ManyToMany: un usuario puede tener varias
 * tareas asignadas, y una tarea puede tener varios usuarios asignados.
 *
 * El lado "dueño" de la relacion ManyToMany esta en Tarea (alli esta
 * la tabla intermedia @JoinTable). Aca del lado de Usuario usamos
 * "mappedBy" para que JPA sepa que esta es la relacion inversa, y
 * @JsonIgnoreProperties para que al convertir a JSON no entre en un
 * loop infinito Usuario -> Tarea -> Usuario -> Tarea...
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato valido")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Lado inverso de la relacion ManyToMany, no genera columnas nuevas.
    // Ignoramos "tareas" al serializar para no arrastrar toda la cadena de
    // relaciones cada vez que devolvemos un Usuario por la API.
    @ManyToMany(mappedBy = "usuariosAsignados")
    @JsonIgnoreProperties({"usuariosAsignados", "proyecto"})
    private Set<Tarea> tareas = new HashSet<>();

    public Usuario() {
    }

    public Usuario(String nombre, String email) {
        this.nombre = nombre;
        this.email = email;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<Tarea> getTareas() {
        return tareas;
    }

    public void setTareas(Set<Tarea> tareas) {
        this.tareas = tareas;
    }
}
