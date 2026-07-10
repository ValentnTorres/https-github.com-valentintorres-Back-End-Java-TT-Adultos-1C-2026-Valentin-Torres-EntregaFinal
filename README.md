# Gestor de Tareas y Proyectos

Proyecto final del curso de Back-End Java (Talento Tech Buenos Aires). Es una aplicación full stack: una API REST hecha con **Spring Boot + MySQL** y un frontend en **React (Vite)** que la consume.

## 🚀 Demo en vivo

| | |
|---|---|
| **Frontend** | https://valentintorres-backend-java-entrega.vercel.app/ |
| **API (backend)** | https://java-entregafinal-valentintorres.onrender.com/api |

> ⚠️ **El backend está en el free tier de Render**, que "duerme" el servicio a los ~15 minutos sin recibir requests. Si hace un rato que nadie entra, el **primer** pedido (ya sea abriendo el frontend o pegándole directo a la API) puede tardar **30 a 60 segundos** en responder mientras el servidor se despierta. No está roto, solo hay que esperar ese primer arranque — el frontend incluso muestra una pantalla propia avisando que esto puede pasar. Una vez despierto responde normal.

Para probar la API directo (sin pasar por el frontend), ver la sección [Ejemplos de uso](#ejemplos-de-uso-datos-de-prueba) más abajo: los mismos `curl` sirven contra `localhost:8080` o contra la URL de Render de arriba, cambiando solo la base.

## Descripción del proyecto

Permite administrar **Proyectos**, **Columnas**, **Usuarios** y **Tareas**. El tablero de tareas es un Kanban al estilo Trello: las columnas (`Pendiente`, `En progreso`, `Completada` por defecto) no son un valor fijo, se pueden crear, renombrar, reordenar y borrar desde la interfaz.

- Un `Proyecto` agrupa varias `Tarea` (relación `@ManyToOne`: cada tarea pertenece a un solo proyecto).
- Una `Tarea` pertenece a una `Columna` (relación `@ManyToOne`: en qué columna del tablero está). Una `Columna` puede marcarse como `esFinal` (por ejemplo "Completada").
- Una `Tarea` puede tener varios `Usuario` asignados, y un usuario puede estar en varias tareas (relación `@ManyToMany`).
- Reglas de negocio: no se puede asignar un usuario a una tarea que está en una columna marcada como `esFinal`, ni asignar dos veces al mismo usuario a la misma tarea, ni borrar una columna que todavía tiene tareas, ni borrar un usuario que todavía está asignado a alguna tarea.

Cumple los tres niveles de la consigna:

- **Mínimo**: CRUD completo (GET/POST/PUT/DELETE), entidades persistidas con JPA, paquetes organizados (`controller`, `service`, `repository`, `model`).
- **Intermedio**: relación `@ManyToOne` (Tarea-Proyecto y Tarea-Columna), validaciones con Hibernate Validator, excepciones personalizadas.
- **Avanzado**: relación `@ManyToMany` (Tarea-Usuario) con validación de negocio propia, manejo centralizado de errores con `@ControllerAdvice`, y CORS configurado para que el frontend (otro origen) pueda consumir la API.

Además, como extra por fuera de la consigna, la API está protegida con **autenticación JWT** (Spring Security), tiene **3 roles con visibilidad distinta** (Admin / PM / Usuario) y todo el proyecto está **desplegado en la nube** (no solo corriendo en local). Ver las secciones [Autenticación y roles](#autenticación-y-roles) y [Cómo fue el desarrollo](#cómo-fue-el-desarrollo).

## Cómo fue el desarrollo

El punto de partida fue lo que pedía la consigna: CRUD completo de Proyecto/Usuario/Tarea/Columna con Spring Boot y MySQL, sumando de a poco las relaciones (`@ManyToOne`, `@ManyToMany`) y las reglas de negocio hasta cubrir el nivel avanzado.

A partir de ahí fui sumando cosas por mi cuenta, no pedidas por la consigna, para dejar el proyecto más redondo:

**Autenticación JWT.** Le agregué login con Spring Security: cada `Usuario` pasó a ser también una cuenta (con contraseña hasheada con BCrypt), y toda la API quedó protegida detrás de un token, salvo el registro y el login. Esto implicó tocar el modelo de `Usuario`, sumar un filtro de seguridad (`JwtAuthFilter`) y adaptar el frontend para manejar sesión (login, logout, y mandar el token en cada request).

**Roles y visibilidad (Admin / PM / Usuario).** Una vez que ya había login, se me ocurrió que tenía sentido que no todos vieran lo mismo: agregué un enum `Rol` y una jerarquía de 3 niveles (ver detalle en [Autenticación y roles](#autenticación-y-roles)). Lo más interesante técnicamente fue la relación autorreferencial en `Usuario` (`pmAsignado`, un `Usuario` apuntando a otro `Usuario`) y filtrar la visibilidad de `Proyecto` según el rol de quien pregunta en vez de devolver siempre todo. En el camino encontré otro bug real: el endpoint `GET /usuarios/equipo` tiraba un 500 (`LazyInitializationException`) cuando el usuario autenticado se incluía a sí mismo en la respuesta, porque ese objeto lo había cargado antes el filtro de seguridad (`JwtAuthFilter`) en una sesión de Hibernate distinta a la que serializa la respuesta. Lo arreglé sacando del JSON la colección `tareas` de `Usuario` (`@JsonIgnore`), que además de resolver el error no la necesitaba ningún endpoint (las tareas de un usuario se consultan al revés, desde `Tarea.usuariosAsignados`).

**Una batería de pruebas manual.** Antes de dar el proyecto por cerrado, probé a mano todos los casos de uso que se me ocurrieron: CRUD normal, casos límite (ids inexistentes, campos vacíos, objetos anidados sin `id`), y las 4 reglas de negocio documentadas. Encontré 2 bugs reales:
  - Crear una tarea mandando `"proyecto": {}` (un objeto vacío, sin `id`) tiraba un error 500 con un mensaje técnico interno en vez de un 400 entendible.
  - Borrar un usuario que todavía estaba asignado a alguna tarea rompía con una violación de foreign key de MySQL cruda, en vez de avisar con un mensaje claro (ya existía esa protección para columnas, pero no para usuarios).

  Los arreglé los dos agregando validaciones explícitas en los services correspondientes.

**Deploy en la nube.** Quise que el proyecto no dependiera de mi máquina para poder mostrarlo, así que lo separé en 3 servicios independientes:
  - **[Clever Cloud](https://www.clever-cloud.com/)** para la base MySQL (plan gratuito "Dev").
  - **[Render](https://render.com/)** para el backend, como imagen Docker (`backend/Dockerfile`).
  - **[Vercel](https://vercel.com/)** para el frontend (build estático de Vite).

  El camino no fue derecho: el plan gratuito de MySQL de Clever Cloud limita a **5 conexiones concurrentes**, y Spring Boot abre un pool de conexiones (HikariCP) de 10 por defecto — el backend ni arrancaba, explotaba con `max_user_connections` apenas Hibernate intentaba crear las tablas. Tuve que bajar el pool a 2 conexiones (de sobra para un proyecto de este tamaño, que no tiene concurrencia real) en `application.properties`. En el medio también me encontré con conexiones colgadas de intentos de deploy anteriores que agotaban el límite igual, que tuve que ir a matar a mano desde la consola de phpMyAdmin (`SHOW PROCESSLIST` + `KILL`).

  También hubo un round de ajustes más simples: el JWT necesitaba una clave de al menos 256 bits (probé con una más corta al principio y explotó), el puerto lo asigna Render dinámicamente (`server.port=${PORT:8080}`), y CORS necesitaba conocer el dominio público del frontend además de `localhost`.

## Estructura del repositorio

```
backend/    -> API REST (Spring Boot)
frontend/   -> Interfaz web (React + Vite)
```

## Cómo ejecutar en local

### Backend

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

Al arrancar, Hibernate crea automáticamente las tablas (`usuarios`, `proyectos`, `tareas`, `columnas`, `tarea_usuario`) según las entidades.

### Frontend

Requisitos: Node.js.

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173` y ya está configurado para llamar a la API en `http://localhost:8080` (ver `frontend/src/api/config.js`). Para que funcione, el backend tiene que estar corriendo.

## Deploy

El proyecto ya está desplegado (ver [Demo en vivo](#-demo-en-vivo) arriba) usando 3 servicios independientes, sin necesitar tarjeta de crédito en ninguno:

1. **Base de datos ([Clever Cloud](https://console.clever-cloud.com), addon MySQL plan "Dev")**: el add-on expone el host, puerto, usuario, contraseña y nombre de la base (variables tipo `MYSQL_ADDON_HOST`, `MYSQL_ADDON_PORT`, `MYSQL_ADDON_USER`, `MYSQL_ADDON_PASSWORD`, `MYSQL_ADDON_DB`).

2. **Backend ([Render](https://render.com), Web Service gratis, tipo Docker)**: apunta a este repo con **Root Directory = `backend`** (usa el `backend/Dockerfile`). Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `MYSQLHOST` | host de Clever Cloud |
   | `MYSQLPORT` | puerto de Clever Cloud |
   | `MYSQLUSER` | usuario de Clever Cloud |
   | `MYSQLPASSWORD` | contraseña de Clever Cloud |
   | `MYSQLDATABASE` | nombre de la base de Clever Cloud |
   | `JWT_SECRET` | clave propia de al menos 32 caracteres (256 bits) |
   | `FRONTEND_URL` | URL pública del frontend en Vercel (para CORS) |

   `PORT` la define Render solo, no hace falta setearla.

3. **Frontend ([Vercel](https://vercel.com)/Netlify)**: **Root Directory = `frontend`**, detecta Vite solo (`npm run build`, carpeta `dist`). Variable de entorno:

   | Variable | Valor |
   |---|---|
   | `VITE_API_BASE_URL` | URL pública del backend en Render + `/api` |

   Como Vite "hornea" las variables `VITE_*` en el momento del build, cambiar esta variable requiere volver a desplegar (no alcanza con reiniciar).

> **Alternativa:** Railway permite tener los 3 servicios (incluyendo MySQL como plugin nativo) en un solo dashboard, pero requiere tarjeta de crédito una vez agotado el crédito de prueba gratuito.

## Autenticación y roles

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

### Roles

Todo `Usuario` tiene un `rol`, con 3 niveles posibles:

- **ADMIN**: ve todos los usuarios y todos los proyectos del sistema.
  Es quien designa a los `PM` (cambiándoles el rol) y arma los equipos
  (asignando usuarios `USER` a un `PM`).
- **PM** (Project Manager): crea proyectos. Cada proyecto que crea
  solo lo puede ver ese `PM` y el equipo que el `ADMIN` le asignó.
- **USER**: rol por defecto al registrarse (`POST /api/usuarios`
  siempre fuerza `rol=USER`, sin importar qué mande el body). Ve
  únicamente los proyectos del `PM` al que el `ADMIN` lo asignó.

Dentro de un proyecto, solo se puede asignar una tarea a alguien del
equipo dueño de ese proyecto (el `PM` que lo creó, o gente asignada a
ese `PM`) — asignar a cualquier otro usuario del sistema tira un 400.

**No hay alta pública de ADMIN.** El primer administrador se marca a
mano, directo en la base de datos, después de registrarse como
cualquier otro usuario:

```sql
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```

De ahí en adelante, ese `ADMIN` ya puede designar PMs y armar equipos
desde la propia interfaz (pestaña **Usuarios**, solo visible para
rol `ADMIN`) o pegándole directo a los endpoints (ver la tabla de
[Endpoints principales](#endpoints-principales)).

## Endpoints principales

| Método | Endpoint                                | Descripción                              | Auth |
|--------|------------------------------------------|-------------------------------------------|------|
| POST   | `/api/auth/login`                        | Login (devuelve el JWT, incluye `rol`)    | No   |
| GET    | `/api/proyectos`                         | Listar proyectos visibles según el rol (ADMIN: todos, PM: los propios, USER: los de su PM) | Sí |
| POST   | `/api/proyectos`                         | Crear proyecto                            | PM o ADMIN |
| PUT    | `/api/proyectos/{id}`                    | Editar proyecto (solo el PM dueño, o ADMIN) | Sí |
| DELETE | `/api/proyectos/{id}`                    | Eliminar proyecto (solo el PM dueño, o ADMIN; borra en cascada sus tareas) | Sí |
| GET    | `/api/columnas`                          | Listar columnas del tablero (ordenadas)   | Sí   |
| POST   | `/api/columnas`                          | Crear columna                             | Sí   |
| PUT    | `/api/columnas/{id}`                     | Renombrar columna / marcarla como final   | Sí   |
| DELETE | `/api/columnas/{id}`                     | Eliminar columna (solo si no tiene tareas)| Sí   |
| PUT    | `/api/columnas/reordenar`                | Reordenar todas las columnas del tablero  | Sí   |
| GET    | `/api/usuarios`                          | Listar **todos** los usuarios del sistema | Solo ADMIN |
| GET    | `/api/usuarios/equipo`                   | Listar el equipo visible para quien pregunta (ADMIN: todos, PM: su equipo, USER: sus compañeros + su PM) | Sí |
| POST   | `/api/usuarios`                          | Crear usuario (registro de cuenta, siempre queda con `rol=USER`) | No |
| PUT    | `/api/usuarios/{id}`                     | Editar usuario                            | Sí   |
| PUT    | `/api/usuarios/{id}/rol`                 | Cambiar el rol de un usuario (`{"rol": "PM"}`) | Solo ADMIN |
| PUT    | `/api/usuarios/{id}/pm`                  | Asignar un usuario a un PM (`{"pmId": 5}`) | Solo ADMIN |
| DELETE | `/api/usuarios/{id}`                     | Eliminar usuario (solo si no está asignado a ninguna tarea) | Sí |
| GET    | `/api/tareas`                            | Listar tareas                             | Sí   |
| POST   | `/api/tareas`                            | Crear tarea                               | Sí   |
| PUT    | `/api/tareas/{id}`                       | Editar tarea                              | Sí   |
| DELETE | `/api/tareas/{id}`                       | Eliminar tarea                            | Sí   |
| POST   | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Asignar un usuario a una tarea (tiene que ser del equipo dueño del proyecto) | Sí |
| DELETE | `/api/tareas/{tareaId}/usuarios/{usuarioId}` | Quitar un usuario de una tarea       | Sí   |

## Probar la API con Postman

Para no tener que armar cada request a mano, en la raíz del repo está [`postman_collection.json`](./postman_collection.json) con todos los endpoints ya cargados (login, registro, y el CRUD completo de proyectos/columnas/usuarios/tareas, incluyendo asignar/quitar usuarios).

Cómo usarla:

1. En Postman: **Import** → arrastrar `postman_collection.json`.
2. La variable de colección `base_url` ya viene apuntando al deploy en Render. Para probar en local, editarla a `http://localhost:8080/api` (ícono del ojo, arriba a la derecha, o Edit → Variables).
3. Correr **Auth → Login** (o **Usuarios → Registrar usuario** primero si todavía no hay ninguna cuenta creada).
4. Copiar el `token` de la respuesta y pegarlo en la variable de colección `token`.
5. De ahí en adelante, todos los demás requests ya usan ese token solos (`Authorization: Bearer {{token}}`), no hace falta tocar nada más.

## Ejemplos de uso (datos de prueba)

Los mismos endpoints, pero por `curl` en vez de Postman. Funcionan tanto contra el backend local como contra el deploy en vivo — solo hay que cambiar la variable `BASE`:

```bash
# En local:
BASE="http://localhost:8080/api"
# O contra el deploy en Render (recordar: el primer pedido puede tardar
# 30-60s si el servicio estaba dormido):
BASE="https://java-entregafinal-valentintorres.onrender.com/api"
```

Crear un usuario (registro, no necesita token):

```bash
curl -X POST "$BASE/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Valentin Torres", "email": "valen@example.com", "password": "secreto123"}'
```

Loguearse para obtener el token (todo lo que sigue lo necesita):

```bash
curl -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "valen@example.com", "password": "secreto123"}'
```

Guardar el `token` de la respuesta anterior en una variable para no repetirlo:

```bash
TOKEN="pegar-el-token-aca"
```

Crear un proyecto:

```bash
curl -X POST "$BASE/proyectos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "Proyecto Final Java", "descripcion": "TP de Talento Tech"}'
```

Crear una tarea dentro del proyecto con id 1, en la columna con id 1 (por defecto, "Pendiente"):

```bash
curl -X POST "$BASE/tareas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo": "Modelar entidades", "descripcion": "JPA + relaciones", "columna": {"id": 1}, "proyecto": {"id": 1}}'
```

Crear una columna nueva:

```bash
curl -X POST "$BASE/columnas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "En revisión", "esFinal": false}'
```

Asignar el usuario con id 1 a la tarea con id 1:

```bash
curl -X POST "$BASE/tareas/1/usuarios/1" \
  -H "Authorization: Bearer $TOKEN"
```

Probar una regla de negocio (asignar el mismo usuario dos veces debería dar 400):

```bash
curl -X POST "$BASE/tareas/1/usuarios/1" \
  -H "Authorization: Bearer $TOKEN"
```

## Notas técnicas

- Todos los archivos del backend y del frontend tienen comentarios en español explicando qué hacen y cómo se conectan con el resto del flujo (`controller → service → repository → model` en el backend, `api → components → App` en el frontend).
- El manejo de errores está centralizado en `GlobalExceptionHandler` (backend), y el frontend muestra esos mensajes de error directamente en cada formulario.
- El pool de conexiones a la base (HikariCP) está achicado a propósito (`spring.datasource.hikari.maximum-pool-size=2`) por el límite de conexiones del plan gratuito de MySQL en producción — ver [Cómo fue el desarrollo](#cómo-fue-el-desarrollo).
