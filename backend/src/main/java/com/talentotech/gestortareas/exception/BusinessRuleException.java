package com.talentotech.gestortareas.exception;

/**
 * Excepcion personalizada para cuando se viola una regla de negocio,
 * por ejemplo: asignar dos veces el mismo usuario a una tarea, o
 * asignarlo a una tarea que ya esta en una columna marcada como final.
 * La agarra GlobalExceptionHandler y la traduce a un 400.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String mensaje) {
        super(mensaje);
    }
}
