package com.talentotech.gestortareas.exception;

/**
 * Se tira en el login cuando el email no existe o la contraseña no
 * coincide. La agarra GlobalExceptionHandler y la traduce a un 401.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException(String mensaje) {
        super(mensaje);
    }
}
