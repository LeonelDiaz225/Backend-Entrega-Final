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

app.get("/", (req, res) => {
  res.render("index", {
    title: "AgroTec",
    message: "Bienvenido al Sistema de Monitoreo Agrícola AgroTec",
  });
});

app.get("/vista/lotes", async (req, res) => {
  try {
    const lotes = await Lote.find().populate("id_productor");
    res.render("lotes", { title: "Listado de Lotes", lotes });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de lotes");
  }
});

app.get("/vista/productores", async (req, res) => {
  try {
    const productores = await Productor.find();
    res.render("productores", { title: "Listado de Productores", productores });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de productores");
  }
});

app.get("/vista/tecnicos", async (req, res) => {
  try {
    const tecnicos = await Tecnico.find();
    res.render("tecnicos", { title: "Listado de Técnicos", tecnicos });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de técnicos");
  }
});

app.get("/vista/tipos-cultivo", async (req, res) => {
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

app.get("/vista/usuarios", async (req, res) => {
  try {
    const usuarios = await User.find();
    res.render("usuarios", { title: "Listado de Usuarios", usuarios });
  } catch (error) {
    res.status(500).send("Error al cargar la vista de usuarios");
  }
});

app.get("/vista/lotes/:id", async (req, res) => {
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