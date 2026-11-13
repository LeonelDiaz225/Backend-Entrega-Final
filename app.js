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
      lotes
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