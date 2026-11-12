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
    const lotes = await Lote.find().populate("id_productor");
    res.render("lotes", { title: "Listado de Lotes", lotes });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de lotes");
  }
});

app.get("/vista/productores", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const productores = await Productor.find();
    res.render("productores", { title: "Listado de Productores", productores });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de productores");
  }
});

app.get("/vista/tecnicos", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const tecnicos = await Tecnico.find();
    res.render("tecnicos", { title: "Listado de Técnicos", tecnicos });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de técnicos");
  }
});

app.get("/vista/tipos-cultivo", authenticateWeb, authorizeWeb("admin", "tecnico"), async (req, res) => {
  try {
    const tiposCultivo = await TipoCultivo.find();
    res.render("tipos_cultivo", {
      title: "Listado de Tipos de Cultivo",
      tiposCultivo,
    });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de tipos de cultivo");
  }
});


app.get("/vista/usuarios", authenticateWeb, authorizeWeb("admin"), async (req, res) => {
    try {
      // Obtener usuarios registrados
      const usuarios = await User.find();

      // Obtener productores registrados
      const productores = await Productor.find()
        .sort({ apellido: 1, nombre: 1 });

      // Enviar los datos a la vista Pug
      res.render("usuarios", {
        title: "Listado de Usuarios",
        usuarios,
        productores,
        creado: req.query.creado === "1"
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
        id_productor
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
      if (password.length < 12) {
        throw new Error(
          "La contraseña debe tener al menos 12 caracteres"
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

        // Comprobar que exista en MongoDB
        const productorExiste = await Productor.exists({
          _id: id_productor
        });

        if (!productorExiste) {
          throw new Error(
            "El productor seleccionado no existe"
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

      // 9. Crear el usuario en MongoDB
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

        const productores = await Productor.find()
          .sort({ apellido: 1, nombre: 1 });

        return res.status(400).render("usuarios", {
          title: "Listado de Usuarios",
          usuarios,
          productores,
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


app.get("/vista/lotes/:id", authenticateWeb, async (req, res) => {
  try {
    const lote = await Lote.findById(req.params.id).populate("id_productor");
    if (!lote) {
      return res.status(404).send("Lote no encontrado");
    }

    const observaciones = await Observacion.find({
      id_lote: req.params.id,
      activa: true,
    }).populate("id_tecnico");

    res.render("lote_detalle", {
      title: `Detalle del Lote ${lote.nombre_numero}`,
      lote,
      observaciones,
    });
  } catch (error) {
    res.status(500).send("Error al cargar el detalle del lote");
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

module.exports = app;