# Gestor de Tareas y Proyectos

Proyecto final del curso de Back-End Java (Talento Tech Buenos Aires). Es una aplicación full stack: una API REST hecha con **Spring Boot + MySQL** y un frontend en **React (Vite)** que la consume.

## Descripción del proyecto

Permite administrar **Proyectos**, **Columnas**, **Usuarios** y **Tareas**. El tablero de tareas es un Kanban al estilo Trello: las columnas (`Pendiente`, `En progreso`, `Completada` por defecto) no son un valor fijo, se pueden crear, renombrar, reordenar y borrar desde la interfaz.

- Un `Proyecto` agrupa varias `Tarea` (relación `@ManyToOne`: cada tarea pertenece a un solo proyecto).
- Una `Tarea` pertenece a una `Columna` (relación `@ManyToOne`: en qué columna del tablero está). Una `Columna` puede marcarse como `esFinal` (por ejemplo "Completada").
- Una `Tarea` puede tener varios `Usuario` asignados, y un usuario puede estar en varias tareas (relación `@ManyToMany`).
- Reglas de negocio: no se puede asignar un usuario a una tarea que está en una columna marcada como `esFinal`, ni asignar dos veces al mismo usuario a la misma tarea, ni borrar una columna que todavía tiene tareas.

Cumple los tres niveles de la consigna:

- **Mínimo**: CRUD completo (GET/POST/PUT/DELETE), entidades persistidas con JPA, paquetes organizados (`controller`, `service`, `repository`, `model`).
- **Intermedio**: relación `@ManyToOne` (Tarea-Proyecto y Tarea-Columna), validaciones con Hibernate Validator, excepciones personalizadas.
- **Avanzado**: relación `@ManyToMany` (Tarea-Usuario) con validación de negocio propia, manejo centralizado de errores con `@ControllerAdvice`, y CORS configurado para que el frontend (otro origen) pueda consumir la API.

> **Nota sobre el esquema:** si ya tenías la base `gestor_tareas` creada de una versión anterior (cuando el estado de la tarea era un enum fijo en vez de la entidad `Columna`), borrala y dejá que Hibernate la recree (`DROP DATABASE gestor_tareas;`), porque cambió la forma de la tabla `tareas`.

## Estructura del repositorio

```
backend/    -> API REST (Spring Boot)
frontend/   -> Interfaz web (React + Vite)
```

## Cómo ejecutar el backend

Requisitos: Java 17 y MySQL corriendo en `localhost:3306`.

1. Crear la base de datos (o dejar que se cree sola, ver `application.properties`):
   ```sql
   CREATE DATABASE gestor_tareas;
   ```
2. Revisar el usuario/contraseña de MySQL en `backend/src/main/resources/application.properties` (por defecto `root` sin contraseña, como viene XAMPP) y ajustarlo si hace falta.
3. Pararse en la carpeta `backend` y levantar la app:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
4. La API queda escuchando en `http://localhost:8080`.

Al arrancar, Hibernate crea automáticamente las tablas (`usuarios`, `proyectos`, `tareas`, `tarea_usuario`) según las entidades.

## Cómo ejecutar el frontend

Requisitos: Node.js.

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173` y ya está configurado para llamar a la API en `http://localhost:8080` (ver `frontend/src/api/config.js`). Para que funcione, el backend tiene que estar corriendo.

## Endpoints principales

| Método | Endpoint                                | Descripción                              |
|--------|------------------------------------------|-------------------------------------------|
| GET    | `/api/proyectos`                         | Listar proyectos                          |
| POST   | `/api/proyectos`                         | Crear proyecto                            |
| PUT    | `/api/proyectos/{id}`                    | Editar proyecto                           |
| DELETE | `/api/proyectos/{id}`                    | Eliminar proyecto                         |
| GET    | `/api/columnas`                          | Listar columnas del tablero (ordenadas)   |
| POST   | `/api/columnas`                          | Crear columna                             |
| PUT    | `/api/columnas/{id}`                     | Renombrar columna / marcarla como final   |
| DELETE | `/api/columnas/{id}`                     | Eliminar columna (solo si no tiene tareas)|
| PUT    | `/api/columnas/reordenar`                | Reordenar todas las columnas del tablero  |
| GET    | `/api/usuarios`                          | Listar usuarios                           |
| POST   | `/api/usuarios`                          | Crear usuario                             |
| PUT    | `/api/usuarios/{id}`                     | Editar usuario                            |
| DELETE | `/api/usuarios/{id}`                     | Eliminar usuario                          |
| GET    | `/api/tareas`                            | Listar tareas                             |
| POST   | `/api/tareas`                            | Crear tarea                               |
| PUT    | `/api/tareas/{id}`                       | Editar tarea                              |
| DELETE | `/api/tareas/{id}`                       | Eliminar tarea                            |
| POST   | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Asignar un usuario a una tarea       |
| DELETE | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Quitar un usuario de una tarea       |

## Ejemplos de uso (datos de prueba)

Crear un proyecto:

```bash
curl -X POST http://localhost:8080/api/proyectos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Proyecto Final Java", "descripcion": "TP de Talento Tech"}'
```

Crear un usuario:

```bash
curl -X POST http://localhost:8080/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Valentin Torres", "email": "valen@example.com"}'
```

Crear una tarea dentro del proyecto con id 1, en la columna con id 1 (por defecto, "Pendiente"):

```bash
curl -X POST http://localhost:8080/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Modelar entidades", "descripcion": "JPA + relaciones", "columna": {"id": 1}, "proyecto": {"id": 1}}'
```

Crear una columna nueva:

```bash
curl -X POST http://localhost:8080/api/columnas \
  -H "Content-Type: application/json" \
  -d '{"nombre": "En revisión", "esFinal": false}'
```

Asignar el usuario con id 1 a la tarea con id 1:

```bash
curl -X POST http://localhost:8080/api/tareas/1/usuarios/1
```

## Notas técnicas

- Todos los archivos del backend y del frontend tienen comentarios en español explicando qué hacen y cómo se conectan con el resto del flujo (`controller → service → repository → model` en el backend, `api → components → App` en el frontend).
- El manejo de errores está centralizado en `GlobalExceptionHandler` (backend), y el frontend muestra esos mensajes de error directamente en cada formulario.
