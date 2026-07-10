package com.talentotech.gestortareas.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Body de PUT /api/usuarios/{id}/pm.
 */
public record AsignarPmRequest(
        @NotNull(message = "El id del PM es obligatorio") Long pmId
) {
}
