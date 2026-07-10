package com.talentotech.gestortareas.exception;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Estructura fija de respuesta para cualquier error de la API.
 * La usa GlobalExceptionHandler para que el frontend siempre se
 * encuentre con el mismo formato de JSON, pase lo que pase del lado
 * del backend.
 */
public class ErrorResponse {

    private LocalDateTime fecha;
    private int status;
    private String error;
    private List<String> mensajes;

    public ErrorResponse(int status, String error, List<String> mensajes) {
        this.fecha = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.mensajes = mensajes;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public List<String> getMensajes() {
        return mensajes;
    }
}
