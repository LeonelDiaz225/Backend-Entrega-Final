const mongoose = require("mongoose");
const TipoCultivo = require("../models/TipoCultivo");
const Observacion = require("../models/Observacion");


function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cultivoTieneObservaciones(nombre) {
  const observacion = await Observacion.exists({
    tipo_cultivo: {
      $regex: "^" + escaparRegex(nombre) + "$",
      $options: "i"
    }
  });

  return Boolean(observacion);
}


/**
 * @openapi
 * components:
 *   schemas:
 *     TipoCultivo:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         nombre:
 *           type: string
 *           example: Soja
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *     TipoCultivoInput:
 *       type: object
 *       required: [nombre]
 *       properties:
 *         nombre:
 *           type: string
 *           example: Soja
 */

/**
 * @openapi
 * /api/tipos-cultivo:
 *   get:
 *     tags: [Tipos de cultivo]
 *     summary: Listar tipos de cultivo
 *     operationId: listTiposCultivo
 *     responses:
 *       '200':
 *         description: Tipos de cultivo encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TipoCultivo'
 *       '500':
 *         description: Error al obtener tipos de cultivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
exports.getAll = async (req, res) => {
  try {
    const tipos = await TipoCultivo.find();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tipos de cultivo" });
  }
};

/**
 * @openapi
 * /api/tipos-cultivo/{id}:
 *   get:
 *     tags: [Tipos de cultivo]
 *     summary: Obtener tipo de cultivo por ID
 *     operationId: getTipoCultivoById
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       '200':
 *         description: Tipo de cultivo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoCultivo'
 *       '400':
 *         description: ID de tipo de cultivo no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Tipo de cultivo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Error al obtener el tipo de cultivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
exports.getById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID de tipo de cultivo no válido" });
    }

    const tipo = await TipoCultivo.findById(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de cultivo no encontrado" });
    }
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el tipo de cultivo" });
  }
};

/**
 * @openapi
 * /api/tipos-cultivo:
 *   post:
 *     tags: [Tipos de cultivo]
 *     summary: Crear tipo de cultivo
 *     operationId: createTipoCultivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoCultivoInput'
 *     responses:
 *       '201':
 *         description: Tipo de cultivo creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoCultivo'
 *       '400':
 *         description: Nombre ausente, inválido o duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del cultivo es obligatorio" });
    }

    const nuevoTipo = await TipoCultivo.create({ nombre: nombre.trim() });
    res.status(201).json(nuevoTipo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "El tipo de cultivo ya existe" });
    }
    res.status(400).json({ error: error.message });
  }
};

/**
 * @openapi
 * /api/tipos-cultivo/{id}:
 *   put:
 *     tags: [Tipos de cultivo]
 *     summary: Actualizar tipo de cultivo
 *     operationId: updateTipoCultivo
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoCultivoInput'
 *     responses:
 *       '200':
 *         description: Tipo de cultivo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoCultivo'
 *       '400':
 *         description: ID o nombre inválido, o nombre duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Tipo de cultivo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

exports.update = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        error: "ID de cultivo no válido"
      });
    }

    const { nombre } = req.body;

    if (typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        error: "El nombre del cultivo es obligatorio"
      });
    }

    const nuevoNombre = nombre.trim();

    const cultivo = await TipoCultivo.findById(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        error: "Tipo de cultivo no encontrado"
      });
    }

    // Evitar nombres duplicados
    const duplicado = await TipoCultivo.findOne({
      _id: { $ne: cultivo._id },
      nombre: {
        $regex: "^" + escaparRegex(nuevoNombre) + "$",
        $options: "i"
      }
    });

    if (duplicado) {
      return res.status(409).json({
        error: "Ya existe otro tipo de cultivo con ese nombre"
      });
    }

    // Proteger el historial de observaciones
    if (cultivo.nombre !== nuevoNombre) {
      const estaEnUso = await cultivoTieneObservaciones(
        cultivo.nombre
      );

      if (estaEnUso) {
        return res.status(409).json({
          error: "No se puede modificar un cultivo utilizado en observaciones"
        });
      }
    }

    cultivo.nombre = nuevoNombre;
    await cultivo.save();

    return res.status(200).json(cultivo);

  } catch (error) {
    console.error("Error al modificar cultivo:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "El tipo de cultivo ya existe"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Datos del cultivo inválidos"
      });
    }

    return res.status(500).json({
      error: "No se pudo modificar el cultivo"
    });
  }
};


/**
 * @openapi
 * /api/tipos-cultivo/{id}:
 *   delete:
 *     tags: [Tipos de cultivo]
 *     summary: Eliminar tipo de cultivo
 *     operationId: deleteTipoCultivo
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       '200':
 *         description: Tipo de cultivo eliminado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       '400':
 *         description: ID de tipo de cultivo no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Tipo de cultivo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Error al eliminar el tipo de cultivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

exports.delete = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Solo el administrador puede eliminar cultivos"
      });
    }

    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        error: "ID de cultivo no válido"
      });
    }

    const cultivo = await TipoCultivo.findById(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        error: "Tipo de cultivo no encontrado"
      });
    }

    const estaEnUso = await cultivoTieneObservaciones(
      cultivo.nombre
    );

    if (estaEnUso) {
      return res.status(409).json({
        error: "No se puede eliminar un cultivo utilizado en observaciones"
      });
    }

    await TipoCultivo.deleteOne({
      _id: cultivo._id
    });

    return res.status(200).json({
      mensaje: "Tipo de cultivo eliminado correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar cultivo:", error.message);

    return res.status(500).json({
      error: "No se pudo eliminar el cultivo"
    });
  }
};
