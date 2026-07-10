package com.talentotech.gestortareas.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Body de POST /api/auth/login.
 */
public record LoginRequest(
        @NotBlank(message = "El email es obligatorio") String email,
        @NotBlank(message = "La contraseña es obligatoria") String password
) {
}
