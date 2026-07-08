package com.talentotech.gestortareas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal de la aplicacion.
 *
 * @SpringBootApplication prende el auto-configurado de Spring Boot:
 * levanta el servidor web embebido (Tomcat), escanea los paquetes de
 * este mismo paquete y subpaquetes buscando @Component/@Service/
 * @Repository/@RestController, y configura JPA con lo que haya en
 * application.properties.
 *
 * Flujo general de la app: al ejecutar main(), Spring arma el
 * contexto -> conecta con MySQL -> crea/actualiza las tablas segun
 * las entidades (model) -> queda escuchando peticiones HTTP en el
 * puerto 8080 (controller -> service -> repository -> base de datos).
 */
@SpringBootApplication
public class GestorTareasApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestorTareasApplication.class, args);
	}

}
