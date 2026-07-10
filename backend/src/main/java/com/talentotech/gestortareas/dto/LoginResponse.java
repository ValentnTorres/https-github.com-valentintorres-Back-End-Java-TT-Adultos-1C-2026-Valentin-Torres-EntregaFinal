package com.talentotech.gestortareas.dto;

/**
 * Respuesta de POST /api/auth/login: el token que el frontend manda
 * en el header Authorization de ahi en adelante, mas los datos basicos
 * del usuario logueado para mostrar en la interfaz.
 */
public record LoginResponse(String token, Long id, String nombre, String email) {
}
