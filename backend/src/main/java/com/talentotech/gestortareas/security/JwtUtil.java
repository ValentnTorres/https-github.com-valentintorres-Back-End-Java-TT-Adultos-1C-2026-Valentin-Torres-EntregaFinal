package com.talentotech.gestortareas.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Genera y valida los tokens JWT. El token solo lleva el email del
 * usuario como "subject": con eso alcanza para volver a buscarlo en la
 * base en cada request (ver JwtAuthFilter), no hace falta guardar mas
 * datos adentro.
 */
@Component
public class JwtUtil {

    private final SecretKey clave;
    private final long expiracionMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secreto,
            @Value("${jwt.expiration-ms}") long expiracionMs
    ) {
        this.clave = Keys.hmacShaKeyFor(secreto.getBytes());
        this.expiracionMs = expiracionMs;
    }

    public String generarToken(String email) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + expiracionMs);
        return Jwts.builder()
                .subject(email)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(clave)
                .compact();
    }

    /**
     * Te devuelve el email si el token es valido (firma correcta y no
     * vencido), o null si es invalido. No tira excepcion para que el
     * filtro simplemente trate la request como no autenticada.
     */
    public String validarYExtraerEmail(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(clave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }
}
