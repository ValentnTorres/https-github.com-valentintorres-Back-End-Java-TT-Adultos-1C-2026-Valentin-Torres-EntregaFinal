package com.talentotech.gestortareas.exception;

/**
 * Excepcion personalizada que tiramos cuando buscas algo por id
 * (Usuario, Proyecto, Tarea, lo que sea) y no existe en la base.
 * La agarra GlobalExceptionHandler y la traduce a un 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
