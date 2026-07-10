package com.talentotech.gestortareas.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * Manejador centralizado de excepciones.
 *
 * @RestControllerAdvice hace que estos metodos le apliquen a TODOS los
 * controllers de la app, asi no repetis try/catch en cada endpoint.
 * Cada metodo agarra un tipo de excepcion puntual y arma una
 * respuesta HTTP prolija y consistente (ver ErrorResponse).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Se dispara cuando algun service lanza ResourceNotFoundException
    // (por ejemplo, buscar una Tarea con un id que no existe).
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> manejarNotFound(ResourceNotFoundException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Recurso no encontrado",
                List.of(ex.getMessage())
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // Se dispara cuando se viola una regla de negocio propia del dominio
    // (por ejemplo, asignar un usuario repetido a una tarea).
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> manejarReglaDeNegocio(BusinessRuleException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Regla de negocio incumplida",
                List.of(ex.getMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Se dispara cuando el login recibe un email/password que no
    // coinciden con ningun usuario.
    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ErrorResponse> manejarCredencialesInvalidas(CredencialesInvalidasException ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Credenciales invalidas",
                List.of(ex.getMessage())
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    // Se dispara solo cuando fallan las validaciones de Hibernate
    // Validator (@NotBlank, @Email, @Size, etc) sobre el body de una
    // request (@Valid en el controller).
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex) {
        List<String> mensajes = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();

        ErrorResponse body = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de validacion",
                mensajes
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Red de seguridad: cualquier otra excepcion no contemplada cae
    // aca en vez de mostrarle al usuario un stacktrace crudo.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarGenerica(Exception ex) {
        ErrorResponse body = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Error interno del servidor",
                List.of(ex.getMessage())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
