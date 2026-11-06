const request = require("supertest");

process.env.JWT_SECRET = "test-secret";

const app = require("../app");

describe("Aplicación HTTP", () => {
  test("expone el health check", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("responde 404 para rutas inexistentes", async () => {
    const response = await request(app).get("/ruta-inexistente");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Ruta no encontrada");
  });

  test("protege las rutas de recursos sin token", async () => {
    const response = await request(app).get("/api/lotes");

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Token requerido");
  });
});
