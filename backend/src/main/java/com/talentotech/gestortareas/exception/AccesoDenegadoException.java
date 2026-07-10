package com.talentotech.gestortareas.exception;

/**
 * Excepcion personalizada para cuando un usuario autenticado intenta
 * una accion que su rol no le permite sobre un recurso puntual (por
 * ejemplo, un PM editando el proyecto de otro PM). La agarra
 * GlobalExceptionHandler y la traduce a un 403.
 *
 * Es distinta de un 401 (que significa "no sabemos quien sos"): aca
 * ya sabemos quien es el usuario, simplemente no le esta permitido.
 */
public class AccesoDenegadoException extends RuntimeException {

    public AccesoDenegadoException(String mensaje) {
        super(mensaje);
    }
}
