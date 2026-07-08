package com.talentotech.gestortareas.exception;

/**
 * Excepcion personalizada para violaciones de reglas de negocio,
 * por ejemplo: asignar dos veces el mismo usuario a una tarea, o
 * asignar un usuario a una tarea que ya esta COMPLETADA.
 * La captura GlobalExceptionHandler y la traduce a un 400.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String mensaje) {
        super(mensaje);
    }
}
