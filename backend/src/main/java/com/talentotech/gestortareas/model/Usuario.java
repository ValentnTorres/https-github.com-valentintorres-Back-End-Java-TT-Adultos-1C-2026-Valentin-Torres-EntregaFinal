package com.talentotech.gestortareas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Usuario.
 *
 * Representa a una persona que puede ser asignada a una o mas Tareas
 * (y que ademas puede loguearse con este mismo email/password, ver
 * AuthController). La relacion con Tarea es ManyToMany: un usuario
 * puede tener varias tareas asignadas, y una tarea puede tener varios
 * usuarios asignados.
 *
 * El lado "dueño" de la relacion ManyToMany esta en Tarea (ahi esta
 * la tabla intermedia @JoinTable). Del lado de Usuario usamos
 * "mappedBy" para que JPA sepa que esta es la relacion inversa, y
 * @JsonIgnoreProperties para que al convertir a JSON no entres en un
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

    // Hash BCrypt de la contraseña (nunca se guarda en texto plano).
    // Sin @NotBlank/@Size aca a proposito: el PUT de edicion reutiliza
    // esta misma clase como @RequestBody y no manda password, asi que
    // esa validacion se hace a mano en UsuarioService.crear() en vez
    // de con Bean Validation (que te aplicaria tambien en el PUT).
    // @JsonProperty WRITE_ONLY: el campo se acepta al crear un usuario
    // (registro) pero nunca se devuelve en las respuestas JSON.
    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    // Lado inverso de la relacion ManyToMany, no genera columnas nuevas.
    // @JsonIgnore: ademas de evitar arrastrar toda la cadena de relaciones,
    // es LAZY (default de @ManyToMany) y en GET /usuarios/equipo el
    // usuario autenticado (@AuthenticationPrincipal, cargado en
    // JwtAuthFilter) puede terminar en la respuesta ya "desprendido" de la
    // sesion de Hibernate que lo cargo - serializar esta coleccion en ese
    // caso tira LazyInitializationException. Ningun endpoint necesita las
    // tareas de un usuario colgando del usuario mismo (se consultan al
    // reves, desde Tarea.usuariosAsignados), asi que directamente no se
    // serializa nunca.
    @ManyToMany(mappedBy = "usuariosAsignados")
    @JsonIgnore
    private Set<Tarea> tareas = new HashSet<>();

    // USER por defecto: UsuarioService.crear() lo fuerza siempre en el
    // alta publica, sin importar que mande el body (para que nadie se
    // autoasigne ADMIN/PM registrandose).
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol = Rol.USER;

    // Autorreferencial: a que PM pertenece este usuario (solo tiene
    // sentido cuando rol=USER). Lo asigna el ADMIN. JsonIgnoreProperties
    // corta la cadena para no arrastrar el pmAsignado del pmAsignado...
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pm_asignado_id")
    @JsonIgnoreProperties({"tareas", "pmAsignado"})
    private Usuario pmAsignado;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<Tarea> getTareas() {
        return tareas;
    }

    public void setTareas(Set<Tarea> tareas) {
        this.tareas = tareas;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public Usuario getPmAsignado() {
        return pmAsignado;
    }

    public void setPmAsignado(Usuario pmAsignado) {
        this.pmAsignado = pmAsignado;
    }
}
