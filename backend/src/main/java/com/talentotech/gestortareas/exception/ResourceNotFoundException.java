package com.talentotech.gestortareas.exception;

/**
 * Excepcion personalizada que lanzamos cuando se busca por id
 * (Usuario, Proyecto o Tarea) y no existe en la base de datos.
 * La captura GlobalExceptionHandler y la traduce a un 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
