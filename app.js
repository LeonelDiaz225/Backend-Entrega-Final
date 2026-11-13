const path = require("path");

require("./config/env");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const mongoose = require("mongoose");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);
app.use(requestLogger);

// Documentación OpenAPI
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Agrotec API",
      version: "1.0.0",
      description:
        "API REST para administrar productores, técnicos, cultivos, lotes y observaciones agrícolas.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    servers: [{ url: "/", description: "Servidor actual" }],
  },
  apis: [path.join(__dirname, "controllers", "*.js").replace(/\\/g, "/")],
});

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configuración del motor de plantillas Pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middlewares para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Rutas de la API REST
const productoresRoutes = require("./routes/productoresRoutes");
const lotesRoutes = require("./routes/lotesRoutes");
const observacionesRoutes = require("./routes/observacionesRoutes");
const tecnicosRoutes = require("./routes/tecnicosRoutes");
const tiposCultivoRoutes = require("./routes/tiposCultivoRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/productores", productoresRoutes);
app.use("/api/lotes", lotesRoutes);
app.use("/api/observaciones", observacionesRoutes);
app.use("/api/tecnicos", tecnicosRoutes);
app.use("/api/tipos-cultivo", tiposCultivoRoutes);
app.use("/api/auth", authRoutes);

// Vistas Pug adaptadas a Mongoose (async/await)
const Lote = require("./models/Lote");
const Observacion = require("./models/Observacion");
const Productor = require("./models/Productor");
const Tecnico = require("./models/Tecnico");
const TipoCultivo = require("./models/TipoCultivo");
const User = require("./models/User");


app.get("/login", (req, res) => {
  res.render("login");
});

const authController = require("./controllers/authController");

app.post("/login", authController.loginWeb);

app.post("/logout", (req, res) => {
  res.clearCookie("agrotec_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  return res.redirect("/login");
});


const authenticateWeb = require("./middleware/authWeb");

const authorizeWeb = require("./middleware/authorizeWeb");


app.get("/", authenticateWeb, (req, res) => {
  res.render("index", {
    title: "AgroTec",
    message: "Bienvenido al Sistema de Monitoreo Agrícola AgroTec",
  });
});



app.get("/vista/lotes", authenticateWeb, async (req, res) => {
  try {

    // 1. Buscar el usuario conectado
    const usuario = await User.findById(req.user.id)
      .select("role id_productor");

    if (!usuario) {
      return res.status(401).send(
        "Usuario no encontrado"
      );
    }

    // 2. Preparar el filtro de MongoDB
    const filtro = {};

    if (usuario.role === "productor") {

      // El productor debe tener una asociación válida
      if (!usuario.id_productor) {
        return res.status(403).send(
          "No tienes un productor asociado"
        );
      }

      // Mostrar solo sus propios lotes
      filtro.id_productor = usuario.id_productor;

    } else if (
      usuario.role !== "admin" &&
      usuario.role !== "tecnico"
    ) {
      return res.status(403).send(
        "No tienes permisos para consultar lotes"
      );
    }

    // 3. Buscar los lotes correspondientes
    const lotes = await Lote.find(filtro)
      .populate("id_productor");

    // 4. Mostrar la vista

    res.render("lotes", {
      title: usuario.role === "productor"
        ? "Mis Lotes"
        : "Listado de Lotes",
      lotes,
      productores: usuario.role === "productor"
        ? []
        : await Productor.find().sort({ apellido: 1, nombre: 1 }),
      rolUsuario: usuario.role,
      creado: req.query.creado === "1",
      editado: req.query.editado === "1",
      eliminado: req.query.eliminado === "1"
    });


  } catch (error) {
    console.error(
      "Error al cargar lotes:",
      error.message
    );

    res.status(500).send(
      "Error al cargar la vista de lotes"
    );
  }
});


// Validar los datos del formulario de lotes
async function validarDatosLote(body) {
  const { nombre_numero, id_productor } = body;

  if (
    typeof nombre_numero !== "string" ||
    !nombre_numero.trim() ||
    typeof id_productor !== "string" ||
    !mongoose.isObjectIdOrHexString(id_productor)
  ) {
    return null;
  }

  const productor = await Productor.findById(id_productor);

  if (!productor) return null;

  return {
    nombre_numero: nombre_numero.trim(),
    id_productor: productor._id
  };
}

// Crear lote desde la web
app.post(
  "/vista/lotes",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      const datos = await validarDatosLote(req.body);

      if (!datos) {
        return res.status(400).send(
          "Nombre de lote o productor inválido"
        );
      }

      await Lote.create(datos);

      return res.redirect("/vista/lotes?creado=1");
    } catch (error) {
      console.error("Error al crear lote:", error.message);
      return res.status(500).send("No se pudo crear el lote");
    }
  }
);

// Mostrar formulario de edición
app.get(
  "/vista/lotes/:id/editar",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de lote inválido");
      }

      const lote = await Lote.findById(req.params.id);

      if (!lote) {
        return res.status(404).send("Lote no encontrado");
      }

      const productores = await Productor.find()
        .sort({ apellido: 1, nombre: 1 });

      return res.render("lote_editar", {
        title: "Editar lote",
        lote,
        productores
      });
    } catch (error) {
      console.error("Error al cargar lote:", error.message);
      return res.status(500).send("No se pudo cargar el lote");
    }
  }
);

// Guardar cambios
app.post(
  "/vista/lotes/:id/editar",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de lote inválido");
      }

      const datos = await validarDatosLote(req.body);

      if (!datos) {
        return res.status(400).send("Datos del lote inválidos");
      }

      const lote = await Lote.findById(req.params.id);

      if (!lote) {
        return res.status(404).send("Lote no encontrado");
      }

      // Evitar cambiar propietario si hay historial
      if (
        String(lote.id_productor) !== String(datos.id_productor)
      ) {
        const tieneObservaciones = await Observacion.exists({
          id_lote: lote._id
        });

        if (tieneObservaciones) {
          return res.status(409).send(
            "No se puede cambiar el productor de un lote con observaciones"
          );
        }
      }

      lote.set(datos);
      await lote.save();

      return res.redirect("/vista/lotes?editado=1");

    } catch (error) {
      console.error("Error al editar lote:", error.message);
      return res.status(500).send("No se pudo modificar el lote");
    }
  }
);

// Eliminar lote desde la web
app.post(
  "/vista/lotes/:id/eliminar",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de lote inválido");
      }

      const lote = await Lote.findById(req.params.id);

      if (!lote) {
        return res.status(404).send("Lote no encontrado");
      }

      const tieneObservaciones = await Observacion.exists({
        id_lote: lote._id
      });

      if (tieneObservaciones) {
        return res.status(409).send(
          "No puedes eliminar un lote con observaciones asociadas"
        );
      }

      await Lote.deleteOne({ _id: lote._id });

      return res.redirect("/vista/lotes?eliminado=1");

    } catch (error) {
      console.error("Error al eliminar lote:", error.message);
      return res.status(500).send("No se pudo eliminar el lote");
    }
  }
);


app.get("/vista/productores", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const productores = await Productor.find();

    res.render("productores", {
      title: "Listado de Productores",
      productores,
      rolUsuario: req.user.role,
      creado: req.query.creado === "1",
      editado: req.query.editado === "1",
      eliminado: req.query.eliminado === "1"
    });

  } catch (error) {
    res.status(500).send("Error al cargar la vista de productores");
  }
});


app.post("/vista/productores", authenticateWeb, authorizeWeb("admin"), async (req, res) => {
    try {

      // Comprobar el origen de la solicitud
      const origin = req.get("origin");
      const fetchSite = req.get("sec-fetch-site");

      if (fetchSite && fetchSite !== "same-origin") {
        return res.status(403).send("Origen no permitido");
      }

      if (origin && origin !== "null") {
        let originURL;

        try {
          originURL = new URL(origin);
        } catch {
          return res.status(403).send("Origen no válido");
        }

        if (originURL.host !== req.get("host")) {
          return res.status(403).send("Origen no permitido");
        }
      }

      if (
        (!origin || origin === "null") &&
        fetchSite !== "same-origin"
      ) {
        return res.status(403).send("Origen no verificable");
      }

      const {
        nombre,
        apellido,
        establecimiento,
        telefono,
        email,
        username,
        password
      } = req.body;

      // Comprobar los campos obligatorios
      if (
        !nombre?.trim() ||
        !apellido?.trim() ||
        !establecimiento?.trim() ||
        !email?.trim() ||
        !username?.trim() ||
        !password
      ) {
        return res.status(400).send(
          "Debes completar todos los campos obligatorios"
        );
      }

      // Validar longitud de la contraseña
      if (password.length < 8) {
        return res.status(400).send(
          "La contraseña debe tener al menos 8 caracteres"
        );
      }

      // Comprobar si el usuario o correo ya existe
      const usuarioExistente = await User.findOne({
        $or: [
          { username: username.trim().toLowerCase() },
          { email: email.trim().toLowerCase() }
        ]
      });

      if (usuarioExistente) {
        return res.status(400).send(
          "El nombre de usuario o correo electrónico ya está registrado"
        );
      }

      // Preparar una sesión de MongoDB
      const session = await mongoose.startSession();

      try {

        await session.withTransaction(async () => {

          // 1. Crear el productor
          const [nuevoProductor] = await Productor.create(
            [{
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              establecimiento: establecimiento.trim(),
              telefono: telefono?.trim() || "",
              email: email.trim().toLowerCase()
            }],
            { session }
          );

          // 2. Crear su cuenta de acceso
          await User.create(
            [{
              username: username.trim().toLowerCase(),
              password,
              nombre: nuevoProductor.nombre,
              apellido: nuevoProductor.apellido,
              email: nuevoProductor.email,
              role: "productor",
              id_productor: nuevoProductor._id,
              id_tecnico: null
            }],
            { session }
          );

        });

      } finally {
        await session.endSession();
      }

      // Redirigir después de finalizar la transacción
      return res.redirect("/vista/productores?creado=1");


    } catch (error) {
      console.error(
        "Error al registrar productor:",
        error.message
      );

      // Error por usuario o email duplicado
      if (error.code === 11000) {
        return res.status(400).send(
          "El nombre de usuario o correo electrónico ya está registrado"
        );
      }

      // Errores de validación del modelo
      if (error.name === "ValidationError") {
        return res.status(400).send(
          "Datos inválidos: " + error.message
        );
      }

      // Otros errores
      return res.status(500).send(
        "No se pudo registrar el productor. Intenta nuevamente."
      );
    }

  }
);


/* ADMINISTRACIÓN DE PRODUCTORES */
app.get(
  "/vista/productores/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de productor inválido");
      }

      const productor = await Productor.findById(req.params.id);

      if (!productor) {
        return res.status(404).send("Productor no encontrado");
      }

      return res.render("productor_editar", {
        title: "Editar productor",
        productor
      });
    } catch (error) {
      console.error("Error al cargar productor:", error.message);
      return res.status(500).send("No se pudo cargar el productor");
    }
  }
);

// Guardar modificación
app.post(
  "/vista/productores/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de productor inválido");
      }

      const {
        nombre,
        apellido,
        establecimiento,
        telefono,
        email
      } = req.body;

      if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof apellido !== "string" ||
        !apellido.trim() ||
        typeof establecimiento !== "string" ||
        typeof telefono !== "string" ||
        typeof email !== "string" ||
        (email.trim() &&
          !/^\S+@\S+\.\S+$/.test(email.trim()))
      ) {
        return res.status(400).send(
          "Datos del productor inválidos"
        );
      }

      const datos = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        establecimiento: establecimiento.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase()
      };

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const productor = await Productor.findById(
            req.params.id
          ).session(session);

          if (!productor) {
            const error = new Error("Productor no encontrado");
            error.status = 404;
            throw error;
          }

          const usuario = await User.findOne({
            id_productor: productor._id
          }).session(session);

          // Una cuenta de acceso necesita correo electrónico
          if (usuario && !datos.email) {
            const error = new Error(
              "El correo es obligatorio para productores con cuenta"
            );
            error.status = 400;
            throw error;
          }

          productor.set(datos);
          await productor.save({ session });

          if (usuario) {
            usuario.nombre = datos.nombre;
            usuario.apellido = datos.apellido;
            usuario.email = datos.email;

            await usuario.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }

      return res.redirect("/vista/productores?editado=1");

    } catch (error) {
      console.error("Error al editar productor:", error.message);

      if (error.status) {
        return res.status(error.status).send(error.message);
      }

      if (error.code === 11000) {
        return res.status(400).send(
          "El correo ya está registrado en otra cuenta"
        );
      }

      if (error.name === "ValidationError") {
        return res.status(400).send(
          "Los datos ingresados no son válidos"
        );
      }

      return res.status(500).send(
        "No se pudo modificar el productor"
      );
    }
  }
);

// Eliminar productor y su cuenta asociada
app.post(
  "/vista/productores/:id/eliminar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de productor inválido");
      }

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const productor = await Productor.findById(
            req.params.id
          ).session(session);

          if (!productor) {
            const error = new Error("Productor no encontrado");
            error.status = 404;
            throw error;
          }

          // Proteger los lotes asociados
          const tieneLotes = await Lote.exists({
            id_productor: productor._id
          }).session(session);

          if (tieneLotes) {
            const error = new Error(
              "No puedes eliminar un productor que tiene lotes asociados"
            );
            error.status = 409;
            throw error;
          }

          // Eliminar la cuenta vinculada, si existe
          await User.deleteMany(
            { id_productor: productor._id },
            { session }
          );

          // Eliminar la ficha del productor
          await Productor.deleteOne(
            { _id: productor._id },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }

      return res.redirect("/vista/productores?eliminado=1");

    } catch (error) {
      console.error("Error al eliminar productor:", error.message);

      if (error.status) {
        return res.status(error.status).send(error.message);
      }

      return res.status(500).send(
        "No se pudo eliminar el productor"
      );
    }
  }
);


app.get("/vista/tecnicos", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const tecnicos = await Tecnico.find();

    res.render("tecnicos", {
      title: "Listado de Técnicos",
      tecnicos,
      rolUsuario: req.user.role,
      creado: req.query.creado === "1",
      editado: req.query.editado === "1",
      eliminado: req.query.eliminado === "1"
    });

  } catch (error) {
    res.status(500).send("Error al cargar la vista de técnicos");
  }
});


app.post("/vista/tecnicos", authenticateWeb, authorizeWeb("admin"), async (req, res) => {
    try {
      // 1. Comprobar el origen de la solicitud
      const origin = req.get("origin");
      const fetchSite = req.get("sec-fetch-site");

      if (fetchSite && fetchSite !== "same-origin") {
        return res.status(403).send("Origen no permitido");
      }

      if (origin && origin !== "null") {
        let originURL;

        try {
          originURL = new URL(origin);
        } catch {
          return res.status(403).send("Origen no válido");
        }

        if (originURL.host !== req.get("host")) {
          return res.status(403).send("Origen no permitido");
        }
      }

      if (
        (!origin || origin === "null") &&
        fetchSite !== "same-origin"
      ) {
        return res.status(403).send("Origen no verificable");
      }

      // 2. Obtener los datos del formulario
      const {
        nombre,
        apellido,
        especialidad,
        telefono,
        email,
        username,
        password
      } = req.body;

      // 3. Validar campos obligatorios
      if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof apellido !== "string" ||
        !apellido.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof username !== "string" ||
        !username.trim() ||
        typeof password !== "string" ||
        !password
      ) {
        return res.status(400).send(
          "Debes completar todos los campos obligatorios"
        );
      }

      // 4. Validar contraseña
      if (password.length < 8) {
        return res.status(400).send(
          "La contraseña debe tener al menos 8 caracteres"
        );
      }

      // 5. Normalizar los datos
      const usuarioNormalizado = username.trim().toLowerCase();
      const emailNormalizado = email.trim().toLowerCase();

      // 6. Comprobar duplicados en users
      const usuarioExistente = await User.findOne({
        $or: [
          { username: usuarioNormalizado },
          { email: emailNormalizado }
        ]
      });

      if (usuarioExistente) {
        return res.status(400).send(
          "El nombre de usuario o correo electrónico ya está registrado"
        );
      }

      // 7. Iniciar transacción
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {

          // Crear la ficha del técnico
          const [nuevoTecnico] = await Tecnico.create(
            [{
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              especialidad:
                typeof especialidad === "string"
                  ? especialidad.trim()
                  : "",
              telefono:
                typeof telefono === "string"
                  ? telefono.trim()
                  : "",
              email: emailNormalizado
            }],
            { session }
          );

          // Crear la cuenta vinculada
          await User.create(
            [{
              username: usuarioNormalizado,
              password,
              nombre: nuevoTecnico.nombre,
              apellido: nuevoTecnico.apellido,
              email: nuevoTecnico.email,
              role: "tecnico",
              id_tecnico: nuevoTecnico._id,
              id_productor: null
            }],
            { session }
          );

        });
      } finally {
        await session.endSession();
      }

      // 8. Confirmar registro
      return res.redirect("/vista/tecnicos?creado=1");

    } catch (error) {
      console.error(
        "Error al registrar técnico:",
        error.message
      );

      if (error.code === 11000) {
        return res.status(400).send(
          "El usuario o correo electrónico ya está registrado"
        );
      }

      if (error.name === "ValidationError") {
        return res.status(400).send(
          "Los datos del técnico no son válidos"
        );
      }

      return res.status(500).send(
        "No se pudo registrar el técnico. Intenta nuevamente."
      );
    }
  }
);


/* ADMINISTRACIÓN DE TÉCNICOS */
// Mostrar formulario de edición
app.get(
  "/vista/tecnicos/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de técnico inválido");
      }

      const tecnico = await Tecnico.findById(req.params.id);

      if (!tecnico) {
        return res.status(404).send("Técnico no encontrado");
      }

      return res.render("tecnico_editar", {
        title: "Editar técnico",
        tecnico
      });
    } catch (error) {
      console.error("Error al cargar técnico:", error.message);
      return res.status(500).send("No se pudo cargar el técnico");
    }
  }
);

// Guardar modificación
app.post(
  "/vista/tecnicos/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de técnico inválido");
      }

      const { nombre, apellido, especialidad, telefono, email } = req.body;

      if (
        typeof nombre !== "string" || !nombre.trim() ||
        typeof apellido !== "string" || !apellido.trim() ||
        typeof especialidad !== "string" ||
        typeof telefono !== "string" ||
        typeof email !== "string" ||
        (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
      ) {
        return res.status(400).send("Datos del técnico inválidos");
      }

      const datos = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        especialidad: especialidad.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase()
      };

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const tecnico = await Tecnico.findById(
            req.params.id
          ).session(session);

          if (!tecnico) {
            const error = new Error("Técnico no encontrado");
            error.status = 404;
            throw error;
          }

          const usuario = await User.findOne({
            id_tecnico: tecnico._id
          }).session(session);

          if (usuario && !datos.email) {
            const error = new Error(
              "El correo es obligatorio para técnicos con cuenta"
            );
            error.status = 400;
            throw error;
          }

          tecnico.set(datos);
          await tecnico.save({ session });

          if (usuario) {
            usuario.nombre = datos.nombre;
            usuario.apellido = datos.apellido;
            usuario.email = datos.email;

            await usuario.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }

      return res.redirect("/vista/tecnicos?editado=1");

    } catch (error) {
      console.error("Error al editar técnico:", error.message);

      if (error.status) {
        return res.status(error.status).send(error.message);
      }

      if (error.code === 11000) {
        return res.status(400).send(
          "El correo ya está registrado en otra cuenta"
        );
      }

      if (error.name === "ValidationError") {
        return res.status(400).send("Datos del técnico inválidos");
      }

      return res.status(500).send("No se pudo modificar el técnico");
    }
  }
);

// Eliminar técnico y cuenta asociada
app.post(
  "/vista/tecnicos/:id/eliminar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de técnico inválido");
      }

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const tecnico = await Tecnico.findById(
            req.params.id
          ).session(session);

          if (!tecnico) {
            const error = new Error("Técnico no encontrado");
            error.status = 404;
            throw error;
          }

          // Proteger observaciones existentes
          const tieneObservaciones = await Observacion.exists({
            id_tecnico: tecnico._id
          }).session(session);

          if (tieneObservaciones) {
            const error = new Error(
              "No puedes eliminar un técnico con observaciones asociadas"
            );
            error.status = 409;
            throw error;
          }

          // No eliminar la cuenta de quien está conectado
          const cuenta = await User.findOne({
            id_tecnico: tecnico._id
          }).session(session);

          if (
            cuenta &&
            String(cuenta._id) === String(req.user.id)
          ) {
            const error = new Error(
              "No puedes eliminar tu propia cuenta"
            );
            error.status = 403;
            throw error;
          }

          await User.deleteMany(
            { id_tecnico: tecnico._id },
            { session }
          );

          await Tecnico.deleteOne(
            { _id: tecnico._id },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }

      return res.redirect("/vista/tecnicos?eliminado=1");

    } catch (error) {
      console.error("Error al eliminar técnico:", error.message);

      if (error.status) {
        return res.status(error.status).send(error.message);
      }

      return res.status(500).send("No se pudo eliminar el técnico");
    }
  }
);


app.get("/vista/tipos-cultivo", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const tiposCultivo = await TipoCultivo.find();
    res.render("tipos_cultivo", {
      title: "Listado de Tipos de Cultivo",
      tiposCultivo,
      rolUsuario: req.user.role,
      creado: req.query.creado === "1",
      editado: req.query.editado === "1",
      eliminado: req.query.eliminado === "1"
    });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de tipos de cultivo");
  }
});

/* ADMINISTRACIÓN DE TIPOS DE CULTIVO */

// Escapar caracteres especiales para búsquedas exactas
function escaparRegexCultivo(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Verificar si un cultivo aparece en observaciones
async function cultivoEnUso(nombre) {
  return Boolean(
    await Observacion.exists({
      tipo_cultivo: {
        $regex: "^" + escaparRegexCultivo(nombre) + "$",
        $options: "i"
      }
    })
  );
}

// Crear tipo de cultivo
app.post(
  "/vista/tipos-cultivo",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      const { nombre } = req.body;

      if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).send(
          "El nombre del cultivo es obligatorio"
        );
      }

      const nombreLimpio = nombre.trim();

      const existente = await TipoCultivo.findOne({
        nombre: {
          $regex: "^" + escaparRegexCultivo(nombreLimpio) + "$",
          $options: "i"
        }
      });

      if (existente) {
        return res.status(409).send(
          "Este tipo de cultivo ya está registrado"
        );
      }

      await TipoCultivo.create({ nombre: nombreLimpio });

      return res.redirect("/vista/tipos-cultivo?creado=1");

    } catch (error) {
      console.error("Error al crear cultivo:", error.message);

      if (error.code === 11000) {
        return res.status(409).send(
          "Este tipo de cultivo ya está registrado"
        );
      }

      return res.status(500).send(
        "No se pudo registrar el cultivo"
      );
    }
  }
);

// Mostrar formulario para editar
app.get(
  "/vista/tipos-cultivo/:id/editar",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de cultivo inválido");
      }

      const cultivo = await TipoCultivo.findById(req.params.id);

      if (!cultivo) {
        return res.status(404).send("Cultivo no encontrado");
      }

      return res.render("tipo_cultivo_editar", {
        title: "Editar tipo de cultivo",
        cultivo
      });

    } catch (error) {
      console.error("Error al cargar cultivo:", error.message);
      return res.status(500).send(
        "No se pudo cargar el cultivo"
      );
    }
  }
);

// Guardar cambios
app.post(
  "/vista/tipos-cultivo/:id/editar",
  authenticateWeb,
  authorizeWeb("admin", "tecnico"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de cultivo inválido");
      }

      const { nombre } = req.body;

      if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).send(
          "El nombre del cultivo es obligatorio"
        );
      }

      const nombreLimpio = nombre.trim();
      const cultivo = await TipoCultivo.findById(req.params.id);

      if (!cultivo) {
        return res.status(404).send("Cultivo no encontrado");
      }

      if (cultivo.nombre !== nombreLimpio) {
        if (await cultivoEnUso(cultivo.nombre)) {
          return res.status(409).send(
            "No puedes renombrar un cultivo utilizado en observaciones"
          );
        }
      }

      const duplicado = await TipoCultivo.findOne({
        _id: { $ne: cultivo._id },
        nombre: {
          $regex: "^" + escaparRegexCultivo(nombreLimpio) + "$",
          $options: "i"
        }
      });

      if (duplicado) {
        return res.status(409).send(
          "Ya existe otro cultivo con ese nombre"
        );
      }

      cultivo.nombre = nombreLimpio;
      await cultivo.save();

      return res.redirect("/vista/tipos-cultivo?editado=1");

    } catch (error) {
      console.error("Error al editar cultivo:", error.message);

      if (error.code === 11000) {
        return res.status(409).send(
          "Ya existe otro cultivo con ese nombre"
        );
      }

      return res.status(500).send(
        "No se pudo modificar el cultivo"
      );
    }
  }
);

// Eliminar tipo de cultivo
app.post(
  "/vista/tipos-cultivo/:id/eliminar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de cultivo inválido");
      }

      const cultivo = await TipoCultivo.findById(req.params.id);

      if (!cultivo) {
        return res.status(404).send("Cultivo no encontrado");
      }

      if (await cultivoEnUso(cultivo.nombre)) {
        return res.status(409).send(
          "No puedes eliminar un cultivo utilizado en observaciones"
        );
      }

      await TipoCultivo.deleteOne({ _id: cultivo._id });

      return res.redirect("/vista/tipos-cultivo?eliminado=1");

    } catch (error) {
      console.error("Error al eliminar cultivo:", error.message);
      return res.status(500).send(
        "No se pudo eliminar el cultivo"
      );
    }
  }
);


app.get("/vista/usuarios", authenticateWeb, authorizeWeb("admin"), async (req, res) => {
    try {
      // Obtener usuarios registrados
      const usuarios = await User.find();

      // Obtener los IDs de productores que ya tienen cuenta
      const idsConCuenta = usuarios
        .filter(usuario =>
          usuario.role === "productor" &&
          usuario.id_productor
        )
        .map(usuario => usuario.id_productor);

      // Obtener solo productores sin cuenta
      const productores = await Productor.find({
        _id: { $nin: idsConCuenta }
      }).sort({ apellido: 1, nombre: 1 });
      

      // Obtener los IDs de técnicos que ya tienen cuenta
      const idsTecnicosConCuenta = usuarios
        .filter(usuario =>
          usuario.role === "tecnico" &&
          usuario.id_tecnico
        )
        .map(usuario => usuario.id_tecnico);

      // Obtener solo técnicos sin cuenta
      const tecnicos = await Tecnico.find({
        _id: { $nin: idsTecnicosConCuenta }
      }).sort({ apellido: 1, nombre: 1 });



      // Enviar los datos a la vista Pug
      
      res.render("usuarios", {
        title: "Listado de Usuarios",
        usuarios,
        productores,
        tecnicos,
        creado: req.query.creado === "1",
        editado: req.query.editado === "1",
        eliminado: req.query.eliminado === "1",
        usuarioActualId: String(req.user.id)
      });


    } catch (error) {
      console.error(
        "Error al cargar usuarios:",
        error.message
      );

      res.status(500).send(
        "Error al cargar la vista de usuarios"
      );
    }
  }
);


app.post("/vista/usuarios", authenticateWeb, authorizeWeb("admin"), async (req, res) => {
    try {
      // 1. Comprobar el origen de la solicitud
      const origin = req.get("origin");
      const fetchSite = req.get("sec-fetch-site");

      if (fetchSite && fetchSite !== "same-origin") {
        return res.status(403).send("Origen no permitido");
      }

      if (origin && origin !== "null") {
        let originURL;

        try {
          originURL = new URL(origin);
        } catch {
          return res.status(403).send("Origen no válido");
        }

        if (originURL.host !== req.get("host")) {
          return res.status(403).send("Origen no permitido");
        }
      }

      if (
        (!origin || origin === "null") &&
        fetchSite !== "same-origin"
      ) {
        return res.status(403).send("Origen no verificable");
      }

      // 2. Comprobar que el administrador siga autorizado
      const adminActual = await User.findById(req.user.id);

      if (!adminActual || adminActual.role !== "admin") {
        return res.status(403).send("Permisos insuficientes");
      }

      // 3. Obtener los campos del formulario
       const {
        username,
        password,
        nombre,
        apellido,
        email,
        role,
        id_productor,
        id_tecnico
      } = req.body;


      // 4. Validar los campos obligatorios
      if (
        !username ||
        !password ||
        !nombre ||
        !apellido ||
        !email ||
        !role
      ) {
        throw new Error("Todos los campos son obligatorios");
      }

      // 5. Validar el rol
      const rolesValidos = ["admin", "tecnico", "productor"];

      if (!rolesValidos.includes(role)) {
        throw new Error("El rol seleccionado no es válido");
      }

      // 6. Validar la contraseña
      if (password.length < 8) {
        throw new Error(
          "La contraseña debe tener al menos 8 caracteres"
        );
      }


      // 7. Preparar los datos del usuario
      const datosUsuario = {
        username: username.trim().toLowerCase(),
        password,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        role
      };

      // 8. Asociar un productor cuando corresponda
      if (role === "productor") {

        if (!id_productor) {
          throw new Error(
            "Debes seleccionar un productor asociado"
          );
        }

        // Verificar el formato del identificador
        const mongoose = require("mongoose");

        if (!mongoose.isObjectIdOrHexString(id_productor)) {
          throw new Error(
            "El identificador del productor no es válido"
          );
        }

        // Buscar al productor en MongoDB
        const productorAsociado = await Productor.findById(id_productor);

        // Comprobar que los datos coincidan con el productor seleccionado
        if (
          nombre.trim().toLowerCase() !==
            productorAsociado.nombre.trim().toLowerCase() ||
          apellido.trim().toLowerCase() !==
            productorAsociado.apellido.trim().toLowerCase()
        ) {
          throw new Error(
            "El nombre y apellido deben coincidir con el productor seleccionado"
          );
        }

        // Evitar dos cuentas para el mismo productor
        const cuentaExistente = await User.exists({
          id_productor: id_productor
        });

        if (cuentaExistente) {
          throw new Error(
            "Este productor ya tiene una cuenta asociada"
          );
        }

        // Guardar la asociación
        datosUsuario.id_productor = id_productor;

      } else {
        // Administradores y técnicos no tienen productor
        datosUsuario.id_productor = null;
      }

      let tecnicoAsociado = null;

      if (role === "tecnico") {

        // Comprobar que se seleccionó un técnico
        if (!id_tecnico) {
          throw new Error("Debes seleccionar un técnico");
        }

        // Verificar el formato del identificador
        if (!mongoose.isObjectIdOrHexString(id_tecnico)) {
          throw new Error("El ID del técnico no es válido");
        }

        // Buscar al técnico en MongoDB
        tecnicoAsociado = await Tecnico.findById(id_tecnico);

        if (!tecnicoAsociado) {
          throw new Error("El técnico seleccionado no existe");
        }

        // Evitar crear dos cuentas para el mismo técnico
        const cuentaExistente = await User.exists({
          id_tecnico: tecnicoAsociado._id
        });

        if (cuentaExistente) {
          throw new Error("Este técnico ya tiene una cuenta de acceso");
        }

        // Comprobar que los datos correspondan al técnico elegido
        if (
          nombre.trim().toLowerCase() !==
            tecnicoAsociado.nombre.trim().toLowerCase() ||
          apellido.trim().toLowerCase() !==
            tecnicoAsociado.apellido.trim().toLowerCase()
        ) {
          throw new Error(
            "El nombre y apellido deben coincidir con el técnico seleccionado"
          );
        }

      }

      // 9. Crear el usuario en MongoDB

      // Guardar la asociación con el técnico
      datosUsuario.id_tecnico = role === "tecnico"
        ? tecnicoAsociado._id
        : null;

      await User.create(datosUsuario);

      // 10. Mostrar confirmación
      return res.redirect("/vista/usuarios?creado=1");

    } catch (error) {
      console.error(
        "Error al crear usuario:",
        error.message
      );

      let mensaje = error.message;

      if (error.code === 11000) {
        mensaje = "El usuario o correo ya está registrado";
      }

      // Recuperar datos para volver a mostrar el formulario
      try {

      const usuarios = await User.find();

      // Productores que ya tienen cuenta
      const idsProductoresConCuenta = usuarios
        .filter(usuario =>
          usuario.role === "productor" &&
          usuario.id_productor
        )
        .map(usuario => usuario.id_productor);

      // Mostrar solo productores sin cuenta
      const productores = await Productor.find({
        _id: { $nin: idsProductoresConCuenta }
      }).sort({ apellido: 1, nombre: 1 });

      // Técnicos que ya tienen cuenta
      const idsTecnicosConCuenta = usuarios
        .filter(usuario =>
          usuario.role === "tecnico" &&
          usuario.id_tecnico
        )
        .map(usuario => usuario.id_tecnico);

      // Mostrar solo técnicos sin cuenta
      const tecnicos = await Tecnico.find({
        _id: { $nin: idsTecnicosConCuenta }
      }).sort({ apellido: 1, nombre: 1 });


        return res.status(400).render("usuarios", {
          title: "Listado de Usuarios",
          usuarios,
          productores,
          tecnicos,
          error: mensaje
        });

      } catch (dbError) {
        console.error(
          "Error al cargar el formulario:",
          dbError.message
        );

        return res.status(500).send(
          "No se pudo cargar el formulario de usuarios"
        );
      }
    }
  }
);


function validarOrigenAdministracion(req) {
  const origin = req.get("origin");
  const fetchSite = req.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin") {
    return false;
  }

  if (origin && origin !== "null") {
    try {
      const url = new URL(origin);

      if (url.host !== req.get("host")) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return Boolean(
    (origin && origin !== "null") ||
    fetchSite === "same-origin"
  );
}

// Mostrar formulario de edición
app.get(
  "/vista/usuarios/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de usuario inválido");
      }

      const usuario = await User.findById(req.params.id);

      if (!usuario) {
        return res.status(404).send("Usuario no encontrado");
      }

      return res.render("usuario_editar", {
        title: "Editar usuario",
        usuario
      });
    } catch (error) {
      console.error("Error al cargar usuario:", error.message);
      return res.status(500).send("No se pudo cargar el usuario");
    }
  }
);

// Guardar cambios del usuario
app.post(
  "/vista/usuarios/:id/editar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de usuario inválido");
      }

      const usuario = await User.findById(req.params.id);

      if (!usuario) {
        return res.status(404).send("Usuario no encontrado");
      }

      const { username, email, password } = req.body;

      if (
        typeof username !== "string" ||
        username.trim().length < 3 ||
        typeof email !== "string" ||
        !/^\S+@\S+\.\S+$/.test(email.trim()) ||
        (password !== undefined && typeof password !== "string")
      ) {
        return res.status(400).send("Datos del formulario inválidos");
      }

      usuario.username = username.trim().toLowerCase();
      usuario.email = email.trim().toLowerCase();

      // Solo cambia la contraseña si se ingresó una nueva
      if (password) {
        if (password.length < 8) {
          return res.status(400).send(
            "La contraseña debe tener al menos 8 caracteres"
          );
        }

        usuario.password = password;
      }

      await usuario.save();

      return res.redirect("/vista/usuarios?editado=1");
    } catch (error) {
      console.error("Error al editar usuario:", error.message);

      if (error.code === 11000) {
        return res.status(400).send(
          "El nombre de usuario o correo ya está registrado"
        );
      }

      if (error.name === "ValidationError") {
        return res.status(400).send("Datos de usuario inválidos");
      }

      return res.status(500).send("No se pudo modificar el usuario");
    }
  }
);

// Eliminar exclusivamente la cuenta de usuario
app.post(
  "/vista/usuarios/:id/eliminar",
  authenticateWeb,
  authorizeWeb("admin"),
  async (req, res) => {
    try {
      if (!validarOrigenAdministracion(req)) {
        return res.status(403).send("Origen no permitido");
      }

      if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).send("ID de usuario inválido");
      }

      if (String(req.params.id) === String(req.user.id)) {
        return res.status(403).send(
          "No puedes eliminar tu propia cuenta"
        );
      }

      const usuario = await User.findById(req.params.id);

      if (!usuario) {
        return res.status(404).send("Usuario no encontrado");
      }

      if (usuario.role === "admin") {
        const cantidadAdmins = await User.countDocuments({
          role: "admin"
        });

        if (cantidadAdmins <= 1) {
          return res.status(403).send(
            "No se puede eliminar el último administrador"
          );
        }
      }

      await User.findByIdAndDelete(usuario._id);

      return res.redirect("/vista/usuarios?eliminado=1");
    } catch (error) {
      console.error("Error al eliminar usuario:", error.message);
      return res.status(500).send("No se pudo eliminar el usuario");
    }
  }
);


app.get("/vista/lotes/:id", authenticateWeb, async (req, res) => {
  try {
    const mongoose = require("mongoose");

    // 1. Buscar al usuario que inició sesión
    const usuario = await User.findById(req.user.id)
      .select("role id_productor");

    if (!usuario) {
      return res.status(401).send("Usuario no encontrado");
    }

    // 2. Comprobar que tenga un rol permitido
    if (!["admin", "tecnico", "productor"].includes(usuario.role)) {
      return res.status(403).send("Acceso denegado");
    }

    // 3. Validar el ID del lote
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).send("ID de lote no válido");
    }

    // 4. Preparar la consulta
    const filtro = {
      _id: req.params.id
    };

    if (usuario.role === "productor") {

      if (!usuario.id_productor) {
        return res.status(403).send(
          "No tienes un productor asociado"
        );
      }

      // Solo permitir el lote del propio productor
      filtro.id_productor = usuario.id_productor;
    }

    // 5. Buscar el lote con los permisos aplicados
    const lote = await Lote.findOne(filtro)
      .populate("id_productor");

    if (!lote) {
      return res.status(404).send("Lote no encontrado");
    }

    // 6. Consultar las observaciones de ese lote
    let consultaObservaciones = Observacion.find({
      id_lote: lote._id,
      activa: true
    });

    if (usuario.role === "productor") {
      // No exponer datos de los técnicos al productor
      consultaObservaciones = consultaObservaciones
        .select("-id_tecnico");
    } else {
      consultaObservaciones = consultaObservaciones
        .populate("id_tecnico");
    }

    const observaciones = await consultaObservaciones;

    // 7. Mostrar el detalle
    return res.render("lote_detalle", {
      title: `Detalle del Lote ${lote.nombre_numero}`,
      lote,
      observaciones
    });

  } catch (error) {
    console.error(
      "Error al cargar detalle del lote:",
      error.message
    );

    return res.status(500).send(
      "Error al cargar el detalle del lote"
    );
  }
});


app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

module.exports = app;