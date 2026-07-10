package com.talentotech.gestortareas.dto;

import com.talentotech.gestortareas.model.Rol;

/**
 * Respuesta de POST /api/auth/login: el token que el frontend manda
 * en el header Authorization de ahi en adelante, mas los datos basicos
 * del usuario logueado para mostrar en la interfaz. "rol" es el que usa
 * el frontend para decidir que pestañas/formularios mostrar.
 */
public record LoginResponse(String token, Long id, String nombre, String email, Rol rol) {
}
