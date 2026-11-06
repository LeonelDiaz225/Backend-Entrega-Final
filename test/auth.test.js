const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");

describe("Seguridad y autenticación", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  test("compara contraseñas usando bcrypt", async () => {
    const user = new User({
      username: "testuser",
      password: await bcrypt.hash("secret123", 12),
      nombre: "Test",
      apellido: "User",
      email: "test@example.com",
    });

    await user.validate();
    await expect(user.comparePassword("secret123")).resolves.toBe(true);
    await expect(user.comparePassword("wrong-password")).resolves.toBe(false);
  });

  test("valida un JWT y autoriza el rol correspondiente", () => {
    const token = jwt.sign(
      { id: "123", username: "admin", role: "admin" },
      process.env.JWT_SECRET
    );
    const req = { get: () => `Bearer ${token}` };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("admin");
  });

  test("rechaza un rol que no tiene permisos", () => {
    const req = { user: { role: "productor" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authorize("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
