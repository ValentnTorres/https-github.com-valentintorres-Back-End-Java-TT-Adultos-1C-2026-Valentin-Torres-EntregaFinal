package com.talentotech.gestortareas.config;

import com.talentotech.gestortareas.model.Columna;
import com.talentotech.gestortareas.model.Proyecto;
import com.talentotech.gestortareas.model.Rol;
import com.talentotech.gestortareas.model.Usuario;
import com.talentotech.gestortareas.repository.ColumnaRepository;
import com.talentotech.gestortareas.repository.ProyectoRepository;
import com.talentotech.gestortareas.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Datos de arranque: se cargan solos la primera vez que la app corre
 * contra una base vacia (local recien clonado, o produccion recien
 * reseteada), para no depender de que alguien los cree a mano. Si ya
 * hay datos cargados, cada CommandLineRunner de aca no hace nada.
 */
@Configuration
public class DatosInicialesConfig {

    /**
     * Las 3 columnas por defecto (Pendiente / En progreso / Completada),
     * para que el tablero no arranque sin ninguna.
     */
    @Bean
    public CommandLineRunner columnasPorDefecto(ColumnaRepository columnaRepository) {
        return args -> {
            if (columnaRepository.count() == 0) {
                columnaRepository.save(new Columna("Pendiente", 0, false));
                columnaRepository.save(new Columna("En progreso", 1, false));
                columnaRepository.save(new Columna("Completada", 2, true));
            }
        };
    }

    /**
     * Una cuenta de cada rol (ADMIN / PM / USER, con el USER ya asignado
     * al PM y el PM con un proyecto propio) para poder probar el sistema
     * de roles sin tener que registrarse ni promover una cuenta a mano
     * por SQL - las mismas credenciales que estan documentadas en el
     * README, en "Cuentas de prueba". Nunca pisa usuarios existentes:
     * solo corre si la tabla usuarios esta completamente vacia.
     */
    @Bean
    public CommandLineRunner usuariosDePrueba(
            UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (usuarioRepository.count() > 0) {
                return;
            }

            Usuario admin = new Usuario("Valentin Torres", "valen@valen.com");
            admin.setPassword(passwordEncoder.encode("valentin123456"));
            admin.setRol(Rol.ADMIN);
            usuarioRepository.save(admin);

            Usuario pm = new Usuario("PM Test", "pm@pm.com");
            pm.setPassword(passwordEncoder.encode("pmtest"));
            pm.setRol(Rol.PM);
            usuarioRepository.save(pm);

            Usuario usuario = new Usuario("Usuario Test", "usuario@usuario.com");
            usuario.setPassword(passwordEncoder.encode("usuariotest"));
            usuario.setRol(Rol.USER);
            usuario.setPmAsignado(pm);
            usuarioRepository.save(usuario);

            Proyecto proyecto = new Proyecto("Proyecto Final Java", "Proyecto de ejemplo para probar el tablero");
            proyecto.setCreadoPor(pm);
            proyectoRepository.save(proyecto);
        };
    }
}
