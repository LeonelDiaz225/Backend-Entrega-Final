# AgroTec

Sistema de monitoreo de lotes agrícolas desarrollado para la entrega final de
Desarrollo Web Backend. El proyecto centraliza productores, técnicos, lotes,
tipos de cultivo y observaciones de campo mediante una API REST con Node.js,
Express, MongoDB y Mongoose.

## Enlaces

| Recurso | Enlace |
| --- | --- |
| Repositorio | [GitHub](https://github.com/LeonelDiaz225/Backend-Entrega-Final.git) |
| Aplicación desplegada | [AgroTec en Render](https://backend-entrega-final-id4y.onrender.com/login) |
| Carpeta de documentación | [Google Drive](https://drive.google.com/drive/folders/15tbDKWcteGK1vAPrlIW_IRnS0gEkEigq?hl=es) |
| Video de presentación | Completar |

## Índice

1. [Descripción](#descripción)
2. [Tecnologías](#tecnologías)
3. [Arquitectura](#arquitectura)
4. [Estructura](#estructura)
5. [Requisitos](#requisitos)
6. [Configuración de entorno](#configuración-de-entorno)
7. [Instalación y ejecución](#instalación-y-ejecución)
8. [MongoDB Compass y MongoDB Atlas](#mongodb-compass-y-mongodb-atlas)
9. [Modelo de datos](#modelo-de-datos)
10. [Autenticación y autorización](#autenticación-y-autorización)
11. [Endpoints](#endpoints)
12. [Vistas Pug](#vistas-pug)
13. [Swagger / OpenAPI](#swagger--openapi)
14. [Migraciones y seed](#migraciones-y-seed)
15. [Pruebas automatizadas](#pruebas-automatizadas)
16. [Pruebas manuales con Postman](#pruebas-manuales-con-postman)
17. [Manejo de errores](#manejo-de-errores)
18. [Despliegue](#despliegue)
19. [Estado de requisitos](#estado-de-requisitos)
20. [Mejoras futuras](#mejoras-futuras)

## Descripción

AgroTec reemplaza el registro manual de controles agrícolas y permite:

- Administrar productores y establecimientos.
- Asociar lotes con productores.
- Administrar técnicos de campo.
- Mantener un catálogo de tipos de cultivo.
- Registrar observaciones por lote y técnico.
- Clasificar observaciones por nivel de alerta.
- Conservar observaciones dadas de baja mediante soft delete.
- Consultar información mediante API REST y vistas server-side con Pug.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Node.js | Entorno de ejecución |
| Express 5 | Servidor HTTP, rutas y middlewares |
| MongoDB | Persistencia documental |
| Mongoose | Modelos, relaciones, validaciones y consultas |
| Pug | Vistas server-side |
| dotenv | Variables de entorno |
| bcryptjs | Hash de contraseñas |
| jsonwebtoken | Autenticación JWT |
| Helmet | Cabeceras de seguridad |
| CORS | Control de orígenes |
| express-rate-limit | Limitación de solicitudes |
| Swagger JSDoc | Generación de documentación OpenAPI |
| migrate-mongo | Migraciones |
| Jest + Supertest | Pruebas automatizadas |
| Render | Despliegue de la aplicación |

## Arquitectura

El proyecto utiliza MVC:

- **Modelos:** esquemas Mongoose, validaciones y referencias.
- **Controladores:** lógica de negocio y respuestas HTTP.
- **Rutas:** endpoints y permisos por rol.
- **Vistas:** plantillas Pug para consultas visuales.
- **Middlewares:** autenticación, autorización, logging, seguridad y errores.
- **Configuración:** conexión, entorno y migraciones separados del servidor.

El arranque está separado en dos responsabilidades:

- `app.js` configura Express y exporta la aplicación para poder testearla.
- `server.js` carga la configuración, conecta MongoDB e inicia el puerto.

## Estructura

```text
Agrotec_Entrega_Final/
├── app.js
├── server.js
├── index.js
├── package.json
├── package-lock.json
├── .env.example
├── prod.env
├── render.yaml
├── vercel.json
├── README.md
├── assets/
│   └── YodaLabs.png
├── config/
│   ├── db.js
│   ├── env.js
│   └── mongo-dns.js
├── controllers/
│   ├── authController.js
│   ├── lotesController.js
│   ├── observacionesController.js
│   ├── productoresController.js
│   ├── tecnicosController.js
│   └── tiposCultivoController.js
├── data/
│   ├── lotes.json
│   ├── observaciones.json
│   ├── productores.json
│   ├── tecnicos.json
│   └── tipos_cultivo.json
├── migrations/
│   ├── 20261012170000-create-initial-collections.js
│   └── 20261012190000-seed-initial-data.js
├── middleware/
│   ├── auth.js
│   ├── authWeb.js
│   ├── authorizeLoteOwner.js
│   ├── authorizeWeb.js
│   ├── errorHandler.js
│   └── requestLogger.js
├── models/
│   ├── Lote.js
│   ├── Observacion.js
│   ├── Productor.js
│   ├── Tecnico.js
│   ├── TipoCultivo.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── lotesRoutes.js
│   ├── observacionesRoutes.js
│   ├── productoresRoutes.js
│   ├── tecnicosRoutes.js
│   └── tiposCultivoRoutes.js
├── scripts/
│   ├── createAdmin.js
│   └── seed.js
├── test/
│   ├── app.test.js
│   └── auth.test.js
└── views/
    ├── index.pug
    ├── layout.pug
    ├── login.pug
    ├── lote_detalle.pug
    ├── lote_editar.pug
    ├── lotes.pug
    ├── observacion_form.pug
    ├── productor_editar.pug
    ├── productores.pug
    ├── tecnico_editar.pug
    ├── tecnicos.pug
    ├── tipo_cultivo_editar.pug
    ├── tipos_cultivo.pug
    ├── usuario_editar.pug
    └── usuarios.pug
```

## Requisitos

- Node.js 18 o superior.
- npm.
- MongoDB local o una cuenta de MongoDB Atlas.
- MongoDB Compass opcional para visualizar datos.
- Postman opcional para pruebas manuales.

## Configuración de entorno

### Desarrollo local

El archivo `.env.example` es una plantilla pública. Se puede subir al
repositorio porque no contiene credenciales reales. Crear el archivo local:

```powershell
Copy-Item .env.example .env
```

Ejemplo:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/agrotec
MONGO_DB_NAME=agrotec
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=2h
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

### Producción y MongoDB Atlas

Para ejecutar el servidor de producción localmente, `prod.env` contiene los
valores reales y permanece fuera de Git:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=agrotec
JWT_SECRET=una-clave-larga-y-privada
JWT_EXPIRES_IN=2h
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

En Render no se sube `prod.env`. Las mismas variables se configuran desde las
variables de entorno del servicio:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster.mongodb.net/agrotec
MONGO_DB_NAME=agrotec
JWT_SECRET=una-clave-larga-y-privada
JWT_EXPIRES_IN=2h
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

`PORT` no necesita configurarse manualmente porque Render administra el puerto.

Nunca publicar en GitHub:

- Contraseña de MongoDB Atlas.
- `JWT_SECRET`.
- `prod.env`.
- `.env`.

El `.gitignore` ya excluye `.env`, archivos `.env.*` y `prod.env`, pero
mantiene disponible `.env.example`.

## Instalación y ejecución

```powershell
npm install
```

Para desarrollo local:

```powershell
npm run migrate:up
npm run seed
npm start
```

El servidor queda disponible en:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

Producción:

```powershell
npm run migrate:up:prod
npm run seed:prod
npm run start:prod
```

## MongoDB Compass y MongoDB Atlas

### MongoDB local

Con MongoDB local iniciado, configurar:

```env
MONGO_URI=mongodb://127.0.0.1:27017/agrotec
```

En Compass conectarse con:

```text
mongodb://127.0.0.1:27017
```

La base se llama `agrotec`. Después de ejecutar migraciones y seed se podrán
ver las colecciones y documentos creados por la aplicación.

### MongoDB Atlas

1. Crear un cluster.
2. Crear un usuario de base de datos.
3. En **Network Access**, agregar la IP permitida. Para Render, cuyas IP
   pueden variar, se puede usar temporalmente `0.0.0.0/0` con un usuario y
   contraseña seguros.
4. Copiar la URI desde **Connect > Drivers**.
5. Colocar la URI completa en `prod.env` para ejecución local o en `MONGO_URI`
   dentro de Render.
6. Ejecutar migración y seed de producción.

Compass también puede conectarse directamente usando la URI de Atlas.

## Modelo de datos

### Productor

Campos principales: `nombre`, `apellido`, `telefono`, `email`,
`establecimiento`.

### Técnico

Campos principales: `nombre`, `apellido`, `telefono`, `email`,
`especialidad`.

### Lote

Campos principales:

- `nombre_numero`.
- `id_productor`: referencia `ObjectId` a `Productor`.

### Tipo de cultivo

Campos principales:

- `nombre`, obligatorio y único.

### Observación

Campos principales:

- `id_lote`: referencia a `Lote`.
- `id_tecnico`: referencia a `Tecnico`.
- `fecha`.
- `tipo_cultivo`.
- `estado_cultivo`.
- `observaciones`.
- `nivel_alerta`: `Normal`, `Atención` o `Crítico`.
- `activa`.

Las observaciones no se eliminan físicamente. `DELETE` cambia `activa` a
`false`, preservando el historial.

### Usuario

Campos principales:

- `username`, único y en minúsculas.
- `password`, almacenada con bcrypt y excluida de consultas por defecto.
- `nombre`, `apellido` y `email`.
- `role`: `admin`, `tecnico` o `productor`.

El registro mediante la API requiere un usuario con rol `admin`. El rol no se
acepta desde el body y el valor predeterminado del modelo es `tecnico`.
Los usuarios `tecnico` deben estar asociados a un registro de `Tecnico` mediante
`id_tecnico`; los usuarios `productor`, a un `Productor` mediante
`id_productor`.

## Autenticación y autorización

### Registro

`POST /api/auth/register` requiere un token de un usuario con rol `admin`.
El controlador no recibe `id_tecnico` ni `id_productor`, por lo que la creación
de usuarios asociados se realiza desde la vista administrativa
`/vista/usuarios`. Para crear el primer administrador se utiliza
`scripts/createAdmin.js`.

### Login

`POST /api/auth/login` valida la contraseña con bcrypt y devuelve un JWT firmado
con `JWT_SECRET`.

Para las rutas protegidas se debe enviar:

```http
Authorization: Bearer <TOKEN>
```

### Permisos

| Recurso | Lectura | Escritura | Eliminación |
| --- | --- | --- | --- |
| Productores | `admin`, `tecnico` | `admin` | `admin` |
| Técnicos | `admin`, `tecnico` | `admin` | `admin` |
| Lotes | Usuario autenticado* | `admin`, `tecnico` | `admin`, `tecnico` |
| Observaciones | `admin`, `tecnico` | `admin`, `tecnico` | `admin`, `tecnico` |
| Tipos de cultivo | `admin`, `tecnico` | `admin`, `tecnico` | `admin` |

`*` Los usuarios con rol `productor` solo pueden consultar sus propios lotes
y el historial de observaciones asociado.

## Endpoints

Base local: `http://localhost:3000`.

Base pública: `https://backend-entrega-final-id4y.onrender.com`.

### Sistema y documentación

| Método | Ruta | Autenticación | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | No | Estado del servicio |
| GET | `/api-docs` | No | Swagger UI |
| GET | `/api-docs.json` | No | Especificación OpenAPI |

### Autenticación

| Método | Ruta | Autenticación | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `Bearer` de `admin` | `username`, `password`, `nombre`, `apellido`, `email` |
| POST | `/api/auth/login` | No | `username`, `password` |

### Productores

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/productores` | Lista productores |
| GET | `/api/productores/:id` | Obtiene un productor |
| POST | `/api/productores` | Crea productor |
| PUT | `/api/productores/:id` | Actualiza productor |
| DELETE | `/api/productores/:id` | Elimina productor |

### Técnicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tecnicos` | Lista técnicos |
| GET | `/api/tecnicos/:id` | Obtiene un técnico |
| POST | `/api/tecnicos` | Crea técnico |
| PUT | `/api/tecnicos/:id` | Actualiza técnico |
| DELETE | `/api/tecnicos/:id` | Elimina técnico |

### Lotes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/lotes` | Lista lotes |
| GET | `/api/lotes?alerta=Crítico` | Filtra por alerta activa |
| GET | `/api/lotes/:id` | Obtiene un lote |
| GET | `/api/lotes/:id/observaciones` | Historial activo del lote |
| POST | `/api/lotes` | Crea lote |
| PUT | `/api/lotes/:id` | Actualiza lote |
| DELETE | `/api/lotes/:id` | Elimina lote |

Body para crear un lote:

```json
{
  "nombre_numero": "Lote 45 Sur",
  "id_productor": "ID_REAL_DEL_PRODUCTOR"
}
```

### Observaciones

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/observaciones` | Lista observaciones activas |
| GET | `/api/observaciones/:id` | Obtiene una observación activa |
| POST | `/api/observaciones` | Registra observación |
| PUT | `/api/observaciones/:id` | Actualiza observación |
| DELETE | `/api/observaciones/:id` | Soft delete |

Body de ejemplo:

```json
{
  "id_lote": "ID_REAL_DEL_LOTE",
  "id_tecnico": "ID_REAL_DEL_TECNICO",
  "fecha": "2026-09-15",
  "tipo_cultivo": "Soja",
  "estado_cultivo": "Brote",
  "observaciones": "Humedad adecuada",
  "nivel_alerta": "Normal"
}
```

### Tipos de cultivo

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tipos-cultivo` | Lista el catálogo |
| GET | `/api/tipos-cultivo/:id` | Obtiene un tipo |
| POST | `/api/tipos-cultivo` | Crea un tipo |
| PUT | `/api/tipos-cultivo/:id` | Actualiza un tipo |
| DELETE | `/api/tipos-cultivo/:id` | Elimina un tipo |

## Vistas Pug

Las vistas son páginas HTML renderizadas en el servidor y protegidas mediante
autenticación web con cookie:

| Ruta | Vista |
| --- | --- |
| `/` | `index.pug` |
| `/login` | `login.pug` |
| `/vista/productores` | `productores.pug` |
| `/vista/tecnicos` | `tecnicos.pug` |
| `/vista/tipos-cultivo` | `tipos_cultivo.pug` |
| `/vista/lotes` | `lotes.pug` |
| `/vista/lotes/:id` | `lote_detalle.pug` |
| `/vista/usuarios` | `usuarios.pug` |

Además de consultar información, las vistas permiten operaciones CRUD mediante
formularios protegidos por rol. Las rutas de creación, edición y eliminación
están implementadas en `app.js`; la API REST sigue disponible para
integraciones externas.

## Swagger / OpenAPI

Los bloques de comentarios `@openapi` de los controladores generan
documentación automáticamente mediante `swagger-jsdoc`. La interfaz permite
consultar endpoints y visualizar esquemas desde:

```text
http://localhost:3000/api-docs
```

La especificación JSON está disponible en:

```text
http://localhost:3000/api-docs.json
```

Swagger no es necesario para que la API funcione. Si se eliminan los comentarios
`@openapi`, la lógica seguirá funcionando, pero la documentación quedará
incompleta. Si se elimina Swagger por completo, también deben quitarse sus
dependencias y configuración de `app.js`.

## Migraciones y seed

Consultar estado:

```powershell
npm run migrate:status
npm run migrate:status:prod
```

Aplicar migraciones:

```powershell
npm run migrate:up
npm run migrate:up:prod
```

Revertir la última migración:

```powershell
npm run migrate:down
npm run migrate:down:prod
```

Crear una migración:

```powershell
npm run migrate:create -- nombre-de-la-migracion
```

Validar los JSON y sus referencias sin conectarse a MongoDB:

```powershell
npm run seed:check
```

Cargar datos:

```powershell
npm run seed
npm run seed:prod
```

El seed es idempotente y evita duplicar los registros iniciales.

## Pruebas automatizadas

Ejecutar:

```powershell
npm test
```

Modo observación:

```powershell
npm run test:watch
```

Las pruebas actuales cubren:

- `GET /health`.
- Respuesta 404 para rutas inexistentes.
- Rechazo de rutas protegidas sin token.
- Comparación segura de contraseñas con bcrypt.
- Validación de JWT.
- Autorización por roles.

`app.test.js` prueba la configuración HTTP sin conectar a MongoDB. Las pruebas
de `auth.test.js` ejercitan el modelo `User` y el middleware de autenticación;
la autenticación consulta el usuario en MongoDB, por lo que esas pruebas deben
ejecutarse con una base disponible o con el acceso a datos simulado.

En el estado actual del proyecto, `npm test` puede fallar en `auth.test.js` si
no se simula la consulta a MongoDB y la respuesta HTTP del middleware. La
prueba de `seed:check` sí funciona sin conexión:

```powershell
npm run seed:check
```

## Pruebas manuales con Postman

### 1. Iniciar el servidor

```powershell
npm start
```

### 2. Crear el primer administrador

Definir `ADMIN_USERNAME`, `ADMIN_PASSWORD` (mínimo 12 caracteres) y
`ADMIN_EMAIL` en `.env`, y ejecutar:

```powershell
node scripts/createAdmin.js
```

El script no crea otro administrador si ya existe uno.

### 3. Iniciar sesión como administrador

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "Secret123456"
}
```

Copiar el campo `token` de la respuesta. En Postman, seleccionar
**Authorization > Bearer Token** y pegarlo.

### 4. Crear un usuario desde la administración web

Para crear un usuario `tecnico` o `productor` asociado a su entidad, ingresar
con el administrador a:

```text
http://localhost:3000/vista/usuarios
```

La vista permite seleccionar el rol y asociar el técnico o productor
correspondiente.

La ruta API de registro también está protegida por rol `admin`, pero actualmente
no recibe los campos de asociación requeridos por los usuarios operativos.

### 5. Referencia de la ruta API de registro

La ruta existe y requiere un token de administrador, pero el controlador no
permite indicar la asociación con un técnico o productor. Con el esquema actual,
puede fallar la validación del usuario `tecnico` predeterminado; para un alta
operativa se debe utilizar `/vista/usuarios`.

```http
POST http://localhost:3000/api/auth/register
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "username": "tecnico1",
  "password": "Secret123",
  "nombre": "Juan",
  "apellido": "Perez",
  "email": "juan@test.com"
}
```

### 6. Iniciar sesión con el usuario creado desde la vista

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "username": "tecnico1",
  "password": "Secret123"
}
```

Copiar el campo `token` de la respuesta. En Postman, seleccionar
**Authorization > Bearer Token** y pegarlo para las siguientes solicitudes.

### 7. Consultar lotes

```http
GET http://localhost:3000/api/lotes
Authorization: Bearer <TOKEN>
```

### 8. Crear un lote

```http
POST http://localhost:3000/api/lotes
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "nombre_numero": "Lote de prueba",
  "id_productor": "ID_REAL_DEL_PRODUCTOR"
}
```

### 9. Casos de error esperados

| Caso | Resultado |
| --- | --- |
| Ruta protegida sin header | `401 Token requerido` |
| Token inválido | `401 Token inválido o expirado` |
| Rol insuficiente | `403 Permisos insuficientes` |
| JSON incompleto | `400` |
| ObjectId inválido | `400` |
| Recurso inexistente | `404` |
| Cultivo no existente | `400` |
| Alerta distinta de `Normal`, `Atención` o `Crítico` | `400` |

También se puede usar cURL:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/api/lotes `
  -H "Authorization: Bearer TOKEN"
```

## Manejo de errores

El middleware centralizado de errores reconoce:

- Errores de validación Mongoose: `400`.
- Identificadores inválidos: `400`.
- Duplicados MongoDB: `409`.
- Errores no controlados: `500`.
- Rutas inexistentes: `404`.

Los controladores mantienen validaciones de negocio específicas, como
existencia de productores, lotes, técnicos y tipos de cultivo.

## Despliegue

La aplicación está desplegada en Render:

```text
https://backend-entrega-final-id4y.onrender.com/login
```

El repositorio conectado al proyecto es:

```text
LeonelDiaz225/Backend-Entrega-Final
```

El archivo `render.yaml` contiene la configuración del servicio actual:
comando de construcción `npm ci`, comando de inicio `npm start` y health check
en `/health`.

### Configuración de Render

En el servicio de Render configurar:

- **Runtime:** Node.
- **Build Command:** `npm ci`.
- **Start Command:** `npm start`.
- **Health Check Path:** `/health`.
- Variables `NODE_ENV`, `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`,
  `JWT_EXPIRES_IN` y, si es necesario, `MONGO_DNS_SERVERS`.

Después de cambiar variables o código, generar un nuevo deploy. Verificar en
los logs que el repositorio clonado sea el correcto y probar:

```text
GET https://backend-entrega-final-id4y.onrender.com/health
GET https://backend-entrega-final-id4y.onrender.com/api-docs
GET https://backend-entrega-final-id4y.onrender.com/login
```

Las migraciones y el seed se ejecutan manualmente contra MongoDB Atlas:

```powershell
npm run migrate:up:prod
npm run seed:prod
```

`index.js` y `vercel.json` permanecen en el repositorio como configuración
alternativa para un eventual despliegue en Vercel; no son utilizados por el
servicio actual de Render.

No colocar credenciales dentro del repositorio. Antes de desplegar verificar:

```powershell
npm test
npm run seed:check
npm audit --omit=dev --audit-level=high
```

## Estado de requisitos

| Requisito | Estado |
| --- | --- |
| Arquitectura MVC | Implementado |
| Ruteo modular | Implementado |
| Controladores separados | Implementado |
| MongoDB con Mongoose | Implementado |
| Relaciones entre entidades | Implementado en lotes y observaciones |
| Validaciones | Implementado en modelos y controladores |
| Async/await | Implementado |
| Middlewares personalizados | Implementado |
| Manejo centralizado de errores | Implementado |
| Hash de contraseñas | Implementado con bcryptjs |
| Autenticación | Implementado con JWT |
| Autorización | Implementado por roles |
| Variables de entorno | Implementado |
| Pruebas automatizadas | Tests presentes; `auth.test.js` requiere aislamiento de MongoDB |
| Documentación de API | Implementado con Swagger/OpenAPI |
| Despliegue | Publicado en Render con MongoDB Atlas |

## Mejoras futuras

- Agregar pruebas de integración usando una base MongoDB de test.
- Completar el registro de usuarios desde la API para permitir asociaciones
  `id_tecnico` e `id_productor`.
- Convertir `Observacion.tipo_cultivo` en referencia `ObjectId` a
  `TipoCultivo`, en lugar de guardar el nombre como texto.
- Agregar paginación y filtros avanzados.
- Incorporar refresh tokens y revocación de tokens.
- Agregar validación de esquemas de entrada con una librería dedicada.
- Incorporar métricas, reportes y geolocalización de lotes.
- Completar el enlace del video de presentación.

## Equipo

| Integrante | Responsabilidad |
| --- | --- |
| Yohana Olivera | Modelos de Productor y Técnico |
| Itziar Urriola | Configuración del servidor, middlewares y dependencias |
| Melisa Salano | Tipos de cultivo y autenticación |
| Maximiliano Millar | Observaciones y soft delete |
| Leonel Diaz | Lotes y vistas Pug |

---

**YodaLabs · IFTS 29 · Desarrollo de Sistemas Web Backend · 2026**
