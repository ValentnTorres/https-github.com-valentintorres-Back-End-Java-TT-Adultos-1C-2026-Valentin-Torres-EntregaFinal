package com.talentotech.gestortareas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Entidad Columna: representa una columna del tablero Kanban (como las
 * "listas" de Trello). Reemplaza al viejo enum EstadoTarea: en vez de
 * tener 3 estados fijos, el usuario puede crear, renombrar, reordenar
 * y borrar sus propias columnas.
 *
 * "esFinal" generaliza la vieja regla de negocio de "no asignar un
 * usuario a una tarea COMPLETADA": ahora se aplica a cualquier columna
 * marcada como final (ver TareaService.asignarUsuario).
 */
@Entity
@Table(name = "columnas")
public class Columna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la columna es obligatorio")
    @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres")
    @Column(nullable = false, length = 60)
    private String nombre;

    // Posicion de la columna en el tablero (0 = primera, de izquierda a
    // derecha). La calcula ColumnaService al crear la columna (ver
    // crear()), por eso no lleva @NotNull: el cliente nunca la manda.
    @Column(nullable = false)
    private Integer orden;

    // Si es true, las tareas de esta columna se consideran "terminadas":
    // no se les puede asignar (ni desasignar tendria sentido revisar)
    // nuevos usuarios.
    @Column(nullable = false)
    private boolean esFinal = false;

    public Columna() {
    }

    public Columna(String nombre, Integer orden, boolean esFinal) {
        this.nombre = nombre;
        this.orden = orden;
        this.esFinal = esFinal;
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

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public boolean isEsFinal() {
        return esFinal;
    }

    public void setEsFinal(boolean esFinal) {
        this.esFinal = esFinal;
    }
}
