import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import complementaryTaskRoutes from "../../src/api/routes/ComplementaryTaskRoute";
import ComplementaryTaskController from "../../src/controllers/ComplementaryTaskController";
import config from "../../config";

// Mock do middleware requireRole
jest.mock("../../src/api/middlewares/RequiredRole", () => ({
  requireRole: () => {
    return (req: any, res: any, next: any) => {
      req.userRole = 'Admin';
      next();
    };
  }
}));

jest.mock("../../config", () => ({
  controllers: {
    complementaryTask: {
      name: "complementaryTaskController"
    }
  },
  services: {
    complementaryTask: {
      name: "complementaryTaskService"
    }
  }
}));

// ----------------------------------------------------
// Mock do Service
// ----------------------------------------------------
const complementaryTaskServiceMock = {
  createComplementaryTask: jest.fn(),
  updateComplementaryTask: jest.fn(),
  getComplementaryTaskById: jest.fn(),
  getAllComplementaryTasks: jest.fn(),
  getComplementaryTasksByVesselVisit: jest.fn(),
  getComplementaryTasksByStatus: jest.fn(),
  getComplementaryTasksByDateRange: jest.fn(),
  getOngoingTasksThatSuspendOperations: jest.fn(),
  deleteComplementaryTask: jest.fn()
};

// ----------------------------------------------------
// Helper para criar app de teste
// ----------------------------------------------------
function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  Container.reset();

  // Logger mock
  Container.set("logger", { 
    error: jest.fn(), 
    info: jest.fn(),
    silly: jest.fn()
  });

  // SERVICE MOCK
  Container.set(
    config.services.complementaryTask.name,
    complementaryTaskServiceMock
  );

  // CONTROLLER REAL
  const controllerInstance = new ComplementaryTaskController(
    complementaryTaskServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.complementaryTask.name,
    controllerInstance
  );

  // Carregar routes reais
  complementaryTaskRoutes(app);

  // Error handler do Celebrate
  app.use(celebrateErrors());

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  return app;
}

// ----------------------------------------------------
// TESTES
// ----------------------------------------------------
describe("ComplementaryTask Routes (Application Tests)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // POST /complementary-tasks
  // -----------------------------
  it("POST /complementary-tasks → 201 when task created successfully", async () => {
    complementaryTaskServiceMock.createComplementaryTask.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ 
        id: "1", 
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        status: "Ongoing"
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "VVE001",
        suspendsOperations: false
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("1");
    expect(complementaryTaskServiceMock.createComplementaryTask).toHaveBeenCalled();
  });

  it("POST /complementary-tasks → 400 when category is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "VVE001",
        suspendsOperations: false
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-tasks → 400 when responsibleTeam is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "VVE001",
        suspendsOperations: false
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-tasks → 400 when startTime is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        vesselVisitExecutionCode: "VVE001",
        suspendsOperations: false
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-tasks → 400 when vesselVisitExecutionCode is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        suspendsOperations: false
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-tasks → 400 when suspendsOperations is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "VVE001"
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-tasks → 400 when service returns failure", async () => {
    complementaryTaskServiceMock.createComplementaryTask.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Vessel visit execution not found",
      errorValue: () => "Vessel visit execution not found"
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-tasks")
      .send({
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "VVE999",
        suspendsOperations: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not found");
  });

  // -----------------------------
  // PUT /complementary-tasks/:id
  // -----------------------------
  it("PUT /complementary-tasks/:id → 200 when task updated successfully", async () => {
    complementaryTaskServiceMock.updateComplementaryTask.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ 
        id: "1", 
        status: "Completed",
        endTime: "2025-01-01T12:00:00Z"
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-tasks/1")
      .send({
        status: "Completed",
        endTime: "2025-01-01T12:00:00Z"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Completed");
  });

  it("PUT /complementary-tasks/:id → 404 when task not found", async () => {
    complementaryTaskServiceMock.updateComplementaryTask.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Complementary task not found",
      errorValue: () => "Complementary task not found"
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-tasks/999")
      .send({
        status: "Completed"
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("PUT /complementary-tasks/:id → 400 when status is invalid", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-tasks/1")
      .send({
        status: "InvalidStatus"
      });

    expect(res.status).toBe(400);
  });

  // -----------------------------
  // GET /complementary-tasks
  // -----------------------------
  it("GET /complementary-tasks → 200 returns all tasks", async () => {
    complementaryTaskServiceMock.getAllComplementaryTasks.mockResolvedValue({
      isSuccess: true,
      getValue: () => [
        { id: "1", category: "Maintenance" },
        { id: "2", category: "Inspection" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  // -----------------------------
  // GET /complementary-tasks/:id
  // -----------------------------
  it("GET /complementary-tasks/:id → 200 when task found", async () => {
    complementaryTaskServiceMock.getComplementaryTaskById.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ 
        id: "1", 
        category: "Maintenance",
        status: "Ongoing"
      })
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("1");
  });

  it("GET /complementary-tasks/:id → 404 when task not found", async () => {
    complementaryTaskServiceMock.getComplementaryTaskById.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Complementary task not found",
      errorValue: () => "Complementary task not found"
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  // -----------------------------
  // GET /complementary-tasks/vessel-visit/:code
  // -----------------------------
  it("GET /complementary-tasks/vessel-visit/:code → 200 returns tasks for vessel visit", async () => {
    complementaryTaskServiceMock.getComplementaryTasksByVesselVisit.mockResolvedValue({
      isSuccess: true,
      getValue: () => [
        { id: "1", vesselVisitExecutionCode: "VVE001" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/vessel-visit/VVE001");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // -----------------------------
  // GET /complementary-tasks/status/:status
  // -----------------------------
  it("GET /complementary-tasks/status/:status → 200 returns tasks with status", async () => {
    complementaryTaskServiceMock.getComplementaryTasksByStatus.mockResolvedValue({
      isSuccess: true,
      getValue: () => [
        { id: "1", status: "Ongoing" },
        { id: "2", status: "Ongoing" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/status/Ongoing");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("GET /complementary-tasks/status/:status → 400 when status is invalid", async () => {
    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/status/InvalidStatus");

    expect(res.status).toBe(400);
  });

  // -----------------------------
  // GET /complementary-tasks/date-range
  // -----------------------------
  it("GET /complementary-tasks/date-range → 200 returns tasks in date range", async () => {
    complementaryTaskServiceMock.getComplementaryTasksByDateRange.mockResolvedValue({
      isSuccess: true,
      getValue: () => [
        { id: "1", startTime: "2025-01-01T10:00:00Z" }
      ]
    });

    const app = createTestApp();

    const res = await request(app)
      .get("/complementary-tasks/date-range")
      .query({
        startDate: "2025-01-01",
        endDate: "2025-01-31"
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("GET /complementary-tasks/date-range → 400 when startDate is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .get("/complementary-tasks/date-range")
      .query({
        endDate: "2025-01-31"
      });

    expect(res.status).toBe(400);
  });

  it("GET /complementary-tasks/date-range → 400 when endDate is missing", async () => {
    const app = createTestApp();

    const res = await request(app)
      .get("/complementary-tasks/date-range")
      .query({
        startDate: "2025-01-01"
      });

    expect(res.status).toBe(400);
  });

  // -----------------------------
  // GET /complementary-tasks/impacting-operations
  // -----------------------------
  it("GET /complementary-tasks/impacting-operations → 200 returns impacting tasks", async () => {
    complementaryTaskServiceMock.getOngoingTasksThatSuspendOperations.mockResolvedValue({
      isSuccess: true,
      getValue: () => [
        { id: "1", suspendsOperations: true, status: "Ongoing" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-tasks/impacting-operations");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // -----------------------------
  // DELETE /complementary-tasks/:id
  // -----------------------------
  it("DELETE /complementary-tasks/:id → 200 when task deleted successfully", async () => {
    complementaryTaskServiceMock.deleteComplementaryTask.mockResolvedValue({
      isSuccess: true
    });

    const app = createTestApp();

    const res = await request(app).delete("/complementary-tasks/1");

    expect(res.status).toBe(200);
    expect(complementaryTaskServiceMock.deleteComplementaryTask).toHaveBeenCalledWith("1");
  });

  it("DELETE /complementary-tasks/:id → 404 when task not found", async () => {
    complementaryTaskServiceMock.deleteComplementaryTask.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Complementary task not found",
      errorValue: () => "Complementary task not found"
    });

    const app = createTestApp();

    const res = await request(app).delete("/complementary-tasks/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});
