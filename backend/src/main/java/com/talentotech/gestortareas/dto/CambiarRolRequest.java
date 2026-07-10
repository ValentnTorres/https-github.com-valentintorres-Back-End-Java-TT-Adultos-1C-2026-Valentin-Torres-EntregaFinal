package com.talentotech.gestortareas.dto;

import com.talentotech.gestortareas.model.Rol;
import jakarta.validation.constraints.NotNull;

/**
 * Body de PUT /api/usuarios/{id}/rol.
 */
public record CambiarRolRequest(
        @NotNull(message = "El rol es obligatorio") Rol rol
) {
}
