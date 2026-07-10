package com.talentotech.gestortareas.controller;

import com.talentotech.gestortareas.dto.LoginRequest;
import com.talentotech.gestortareas.dto.LoginResponse;
import com.talentotech.gestortareas.exception.CredencialesInvalidasException;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import com.talentotech.gestortareas.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller de autenticacion. El registro de cuentas no va aca:
 * es POST /api/usuarios (ver UsuarioController), que ya se encarga de
 * crear el Usuario con su contraseña hasheada. Este controller solo te
 * entrega el token cuando el login sale bien.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new CredencialesInvalidasException("Email o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("Email o contraseña incorrectos");
        }

        String token = jwtUtil.generarToken(usuario.getEmail());
        return new LoginResponse(token, usuario.getId(), usuario.getNombre(), usuario.getEmail());
    }
}
