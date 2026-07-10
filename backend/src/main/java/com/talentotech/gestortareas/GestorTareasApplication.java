package com.talentotech.gestortareas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal de la aplicacion.
 *
 * @SpringBootApplication prende todo el auto-configurado de Spring
 * Boot de una: levanta el servidor web embebido (Tomcat), escanea este
 * paquete y los subpaquetes buscando @Component/@Service/@Repository/
 * @RestController, y configura JPA con lo que haya en
 * application.properties. No hace falta tocar nada mas aca.
 *
 * Flujo general de la app: al correr main(), Spring arma el contexto,
 * se conecta a MySQL, crea o actualiza las tablas segun las entidades
 * (model) y se queda escuchando peticiones HTTP en el puerto que
 * corresponda (controller -> service -> repository -> base de datos).
 */
@SpringBootApplication
public class GestorTareasApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestorTareasApplication.class, args);
	}

}
