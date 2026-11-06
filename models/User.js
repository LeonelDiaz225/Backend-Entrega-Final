const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "El nombre de usuario es obligatorio"],
            unique: true,
            trim: true,
            minlength: [3, "El nombre de usuario debe tener al menos 3 caracteres"],
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "La contraseña es obligatoria"],
            minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
            select: false,
        },
        nombre: {
            type: String,
            required: [true, "El nombre es obligatorio"],
            trim: true,
        },
        apellido: {
            type: String,
            required: [true, "El apellido es obligatorio"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "El correo electrónico es obligatorio"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Por favor ingresa un correo válido"],
        },
        role: {
            type: String,
            enum: ["admin", "tecnico", "productor"],
            default: "tecnico",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function hashPassword(next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    return next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);