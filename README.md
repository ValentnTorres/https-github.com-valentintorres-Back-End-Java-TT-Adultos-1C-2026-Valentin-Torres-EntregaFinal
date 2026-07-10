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

Además, como extra por fuera de la consigna, la API está protegida con **autenticación JWT** (Spring Security): hay que registrarse/loguearse para poder usarla. Ver la sección [Autenticación](#autenticación).

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

## Deploy (3 servicios separados, sin tarjeta)

El proyecto está preparado para desplegarse como 3 servicios independientes: **MySQL**, **backend** y **frontend**. Ninguno de los tres necesita cambios de código, solo configurar variables de entorno desde el dashboard de cada plataforma. Stack elegido: **Clever Cloud** (MySQL), **Render** (backend) y **Vercel/Netlify** (frontend).

> Las políticas de "gratis sin tarjeta" de estas plataformas cambian seguido (Aiven, por ejemplo, ahora pide tarjeta para el free tier) — conviene verificarlo al registrarse.

1. **Base de datos (Clever Cloud, addon MySQL plan "Dev")**: registrarse en [console.clever-cloud.com](https://console.clever-cloud.com), crear un **Add-on → MySQL → plan Dev** (gratis). En la pestaña de información/variables del add-on quedan expuestos el host, puerto, usuario, contraseña y nombre de la base (variables tipo `MYSQL_ADDON_HOST`, `MYSQL_ADDON_PORT`, `MYSQL_ADDON_USER`, `MYSQL_ADDON_PASSWORD`, `MYSQL_ADDON_DB` — los nombres exactos pueden variar, fijarse en el panel).

2. **Backend (Render.com, Web Service gratis)**: crear un servicio nuevo de tipo **Docker**, apuntando a este repo con **Root Directory = `backend`** (usa el `backend/Dockerfile` que ya está en el repo). Variables de entorno a setear, con los valores que dio Clever Cloud en el paso 1:

   | Variable | Valor |
   |---|---|
   | `MYSQLHOST` | `MYSQL_ADDON_HOST` de Clever Cloud |
   | `MYSQLPORT` | `MYSQL_ADDON_PORT` de Clever Cloud |
   | `MYSQLUSER` | `MYSQL_ADDON_USER` de Clever Cloud |
   | `MYSQLPASSWORD` | `MYSQL_ADDON_PASSWORD` de Clever Cloud |
   | `MYSQLDATABASE` | `MYSQL_ADDON_DB` de Clever Cloud |
   | `JWT_SECRET` | una clave propia para producción (no reusar la que quedó commiteada) |
   | `FRONTEND_URL` | la URL pública que te asigne Vercel/Netlify al frontend (para CORS) |

   `PORT` la define Render solo, no hace falta setearla. Nota: el free tier de Render "duerme" el servicio a los ~15 min sin requests, así que el primer pedido después de un rato de inactividad tarda unos 30-60 segundos en responder (se está "despertando").

3. **Frontend (Vercel o Netlify)**: importar el repo, con **Root Directory = `frontend`**. Ambos detectan Vite solos (`npm run build`, carpeta de salida `dist`). Variable de entorno a setear:

   | Variable | Valor |
   |---|---|
   | `VITE_API_BASE_URL` | la URL pública del backend en Render + `/api` (ej. `https://gestor-tareas-backend.onrender.com/api`) |

   Importante: como Vite solo "hornea" las variables `VITE_*` en el momento del build, si cambiás `VITE_API_BASE_URL` después hay que redesplegar el frontend (no alcanza con reiniciarlo).

> **Alternativa paga:** si en algún momento preferís no lidiar con el "sleep" del free tier ni con la incertidumbre de qué proveedor de MySQL sigue siendo gratis, Railway permite tener los 3 servicios (incluyendo MySQL como plugin nativo) en un solo dashboard por un consumo que para un proyecto de este tamaño ronda centavos por mes — la configuración es la misma (mismas variables de entorno), solo cambia dónde las cargás.

## Autenticación

La API usa JWT: todos los endpoints bajo `/api/**` requieren un token
válido en el header `Authorization: Bearer <token>`, **excepto** `POST
/api/usuarios` (registro) y `POST /api/auth/login` (login), que son
públicos.

Cada `Usuario` es también una cuenta: al crearlo (`POST /api/usuarios`)
hay que mandar `password` (mínimo 6 caracteres) además de `nombre` y
`email`. El campo nunca se devuelve en las respuestas (se guarda
hasheado con BCrypt). El login devuelve el token:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "valen@example.com", "password": "secreto123"}'
```

El frontend maneja esto solo: muestra una pantalla de login/registro
cuando no hay sesión guardada, y agrega el header `Authorization` en
todas las llamadas a la API (ver `frontend/src/api/config.js`).

## Endpoints principales

| Método | Endpoint                                | Descripción                              | Auth |
|--------|------------------------------------------|-------------------------------------------|------|
| POST   | `/api/auth/login`                        | Login (devuelve el JWT)                   | No   |
| GET    | `/api/proyectos`                         | Listar proyectos                          | Sí   |
| POST   | `/api/proyectos`                         | Crear proyecto                            | Sí   |
| PUT    | `/api/proyectos/{id}`                    | Editar proyecto                           | Sí   |
| DELETE | `/api/proyectos/{id}`                    | Eliminar proyecto                         | Sí   |
| GET    | `/api/columnas`                          | Listar columnas del tablero (ordenadas)   | Sí   |
| POST   | `/api/columnas`                          | Crear columna                             | Sí   |
| PUT    | `/api/columnas/{id}`                     | Renombrar columna / marcarla como final   | Sí   |
| DELETE | `/api/columnas/{id}`                     | Eliminar columna (solo si no tiene tareas)| Sí   |
| PUT    | `/api/columnas/reordenar`                | Reordenar todas las columnas del tablero  | Sí   |
| GET    | `/api/usuarios`                          | Listar usuarios                           | Sí   |
| POST   | `/api/usuarios`                          | Crear usuario (registro de cuenta)        | No   |
| PUT    | `/api/usuarios/{id}`                     | Editar usuario                            | Sí   |
| DELETE | `/api/usuarios/{id}`                     | Eliminar usuario                          | Sí   |
| GET    | `/api/tareas`                            | Listar tareas                             | Sí   |
| POST   | `/api/tareas`                            | Crear tarea                               | Sí   |
| PUT    | `/api/tareas/{id}`                       | Editar tarea                              | Sí   |
| DELETE | `/api/tareas/{id}`                       | Eliminar tarea                            | Sí   |
| POST   | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Asignar un usuario a una tarea       | Sí   |
| DELETE | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Quitar un usuario de una tarea       | Sí   |

## Ejemplos de uso (datos de prueba)

Crear un usuario (registro, no necesita token):

```bash
curl -X POST http://localhost:8080/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Valentin Torres", "email": "valen@example.com", "password": "secreto123"}'
```

Loguearse para obtener el token (todo lo que sigue lo necesita):

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "valen@example.com", "password": "secreto123"}'
```

Guardar el `token` de la respuesta anterior en una variable para no repetirlo:

```bash
TOKEN="pegar-el-token-aca"
```

Crear un proyecto:

```bash
curl -X POST http://localhost:8080/api/proyectos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "Proyecto Final Java", "descripcion": "TP de Talento Tech"}'
```

Crear una tarea dentro del proyecto con id 1, en la columna con id 1 (por defecto, "Pendiente"):

```bash
curl -X POST http://localhost:8080/api/tareas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo": "Modelar entidades", "descripcion": "JPA + relaciones", "columna": {"id": 1}, "proyecto": {"id": 1}}'
```

Crear una columna nueva:

```bash
curl -X POST http://localhost:8080/api/columnas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "En revisión", "esFinal": false}'
```

Asignar el usuario con id 1 a la tarea con id 1:

```bash
curl -X POST http://localhost:8080/api/tareas/1/usuarios/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Notas técnicas

- Todos los archivos del backend y del frontend tienen comentarios en español explicando qué hacen y cómo se conectan con el resto del flujo (`controller → service → repository → model` en el backend, `api → components → App` en el frontend).
- El manejo de errores está centralizado en `GlobalExceptionHandler` (backend), y el frontend muestra esos mensajes de error directamente en cada formulario.
