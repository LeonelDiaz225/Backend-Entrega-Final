# AgroTec

Sistema de monitoreo de lotes agrícolas desarrollado para la entrega final de
Desarrollo Web Backend. El proyecto centraliza productores, técnicos, lotes,
tipos de cultivo y observaciones de campo mediante una API REST con Node.js,
Express, MongoDB y Mongoose.

## Enlaces

| Recurso | Enlace |
| --- | --- |
| Repositorio | [GitHub](https://github.com/LeonelDiaz225/Backend-Entrega-Final.git) |
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
| Render | Configuración de despliegue |

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
├── package.json
├── package-lock.json
├── .env.example
├── prod.env
├── render.yaml
├── README.md
├── assets/
│   ├── DSWB_2A_YodaLabs-Informe_2C26.docx
│   ├── DSWB_2A_YodaLabs-SegundaEntrega.docx
│   ├── Img1.JPG
│   ├── Img2.JPG
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
│   └── seed.js
├── test/
│   ├── app.test.js
│   └── auth.test.js
└── views/
    ├── index.pug
    ├── lote_detalle.pug
    ├── lotes.pug
    ├── productores.pug
    ├── tecnicos.pug
    ├── tipos_cultivo.pug
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

`prod.env` se utiliza únicamente cuando se ejecuta `npm run start:prod`.
Debe contener valores reales y permanecer fuera de Git:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=agrotec
JWT_SECRET=una-clave-larga-y-privada
JWT_EXPIRES_IN=2h
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

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
3. Agregar la IP del equipo en **Network Access**.
4. Copiar la URI desde **Connect > Drivers**.
5. Colocar la URI completa en `prod.env`.
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

El registro público crea usuarios con rol `tecnico` por defecto. El rol no se
acepta desde el body de registro.

## Autenticación y autorización

### Registro

`POST /api/auth/register` no requiere token.

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
| Productores | Cualquier usuario autenticado | `admin` | `admin` |
| Técnicos | Cualquier usuario autenticado | `admin` | `admin` |
| Lotes | Cualquier usuario autenticado | `admin`, `tecnico` | `admin` |
| Observaciones | Cualquier usuario autenticado | `admin`, `tecnico` | `admin`, `tecnico` |
| Tipos de cultivo | Cualquier usuario autenticado | `admin` | `admin` |

## Endpoints

Base local: `http://localhost:3000`.

### Sistema y documentación

| Método | Ruta | Autenticación | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | No | Estado del servicio |
| GET | `/api-docs` | No | Swagger UI |
| GET | `/api-docs.json` | No | Especificación OpenAPI |

### Autenticación

| Método | Ruta | Body |
| --- | --- | --- |
| POST | `/api/auth/register` | `username`, `password`, `nombre`, `apellido`, `email` |
| POST | `/api/auth/login` | `username`, `password` |

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

Las vistas son consultas HTML renderizadas en el servidor:

| Ruta | Vista |
| --- | --- |
| `/` | `index.pug` |
| `/vista/productores` | `productores.pug` |
| `/vista/tecnicos` | `tecnicos.pug` |
| `/vista/tipos-cultivo` | `tipos_cultivo.pug` |
| `/vista/lotes` | `lotes.pug` |
| `/vista/lotes/:id` | `lote_detalle.pug` |
| `/vista/usuarios` | `usuarios.pug` |

Estas vistas son principalmente de consulta. Las operaciones de escritura se
realizan desde la API REST.

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

Las pruebas no requieren una conexión real a MongoDB porque testean la
configuración HTTP y los middlewares aislados.

## Pruebas manuales con Postman

### 1. Iniciar el servidor

```powershell
npm start
```

### 2. Registrar un usuario

```http
POST http://localhost:3000/api/auth/register
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

### 3. Iniciar sesión

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

### 4. Consultar lotes

```http
GET http://localhost:3000/api/lotes
Authorization: Bearer <TOKEN>
```

### 5. Crear un lote

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

### 6. Casos de error esperados

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

El archivo `render.yaml` define:

- Servicio web Node.
- `npm ci` como build command.
- `npm start` como start command.
- `/health` como health check.
- Variables de entorno requeridas.

En Render configurar como variables privadas:

```text
MONGO_URI
MONGO_DB_NAME
JWT_SECRET
JWT_EXPIRES_IN
```

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
| Pruebas automatizadas | Implementado con Jest y Supertest |
| Documentación de API | Implementado con Swagger/OpenAPI |
| Despliegue | Configuración Render incluida |

## Mejoras futuras

- Agregar pruebas de integración usando una base MongoDB de test.
- Crear un usuario administrador mediante migración o comando seguro de
  inicialización.
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
