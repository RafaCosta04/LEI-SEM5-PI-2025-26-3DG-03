import ComplementaryTaskService from "../../src/services/ComplementaryTaskService";
import { ComplementaryTask } from "../../src/domain/ComplementaryTask";
import { ComplementaryTaskStatus } from "../../src/domain/ComplementaryTaskEnums";
import { VesselVisitExecution } from "../../src/domain/VesselVisitExecution";
import { Result } from "../../src/core/logic/Result";

// -----------------------------------------
// Fake Repositories
// -----------------------------------------
class ComplementaryTaskRepoFake {
  private data: ComplementaryTask[] = [];
  private idCounter = 1;

  async findAll() {
    return this.data;
  }

  async findById(id: string) {
    return this.data.find(x => x.id === id) ?? null;
  }

  async findByVesselVisitExecutionCode(code: string) {
    return this.data.filter(x => x.vesselVisitExecutionCode === code);
  }

  async findByStatus(status: ComplementaryTaskStatus) {
    return this.data.filter(x => x.status === status);
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this.data.filter(x => 
      x.startTime >= startDate && x.startTime <= endDate
    );
  }

  async findOngoingThatSuspendOperations() {
    return this.data.filter(x => 
      x.status === ComplementaryTaskStatus.Ongoing && x.suspendsOperations
    );
  }

  async save(domain: ComplementaryTask) {
    const withId = new ComplementaryTask(
      String(this.idCounter++),
      domain.category,
      domain.responsibleTeam,
      domain.startTime,
      domain.status,
      domain.vesselVisitExecutionCode,
      domain.suspendsOperations,
      domain.endTime,
      domain.description
    );
    this.data.push(withId);
    return withId;
  }

  async update(domain: ComplementaryTask) {
    const index = this.data.findIndex(x => x.id === domain.id);
    if (index === -1) return null;
    this.data[index] = domain;
    return domain;
  }

  async delete(id: string) {
    const index = this.data.findIndex(x => x.id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    return true;
  }
}

class VesselVisitExecutionRepoFake {
  private data: any[] = [];

  async findByCode(code: string) {
    return this.data.find(x => x.code === code) ?? null;
  }

  addMock(code: string) {
    this.data.push({ code });
  }
}

// Logger Fake
const loggerFake = {
  error: jest.fn(),
  info: jest.fn(),
};

describe("ComplementaryTaskService – Aggregate Tests", () => {

  let repo: ComplementaryTaskRepoFake;
  let vveRepo: VesselVisitExecutionRepoFake;
  let service: ComplementaryTaskService;

  beforeEach(() => {
    repo = new ComplementaryTaskRepoFake();
    vveRepo = new VesselVisitExecutionRepoFake();
    service = new ComplementaryTaskService(repo as any, vveRepo as any, loggerFake);
  });

  // ---------------------------------------------
  // CREATE – aggregate flow
  // ---------------------------------------------
  it("should create a new ComplementaryTask successfully", async () => {
    vveRepo.addMock("VVE001");

    const dto = {
      category: "Maintenance",
      responsibleTeam: "Engineering Team",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false,
      description: "Test task"
    };

    const result = await service.createComplementaryTask(dto);

    expect(result.isSuccess).toBe(true);
    const task = result.getValue();
    expect(task.id).toBe("1");
    expect(task.category).toBe("Maintenance");
    expect(task.status).toBe(ComplementaryTaskStatus.Ongoing);

    const stored = await repo.findById("1");
    expect(stored).not.toBeNull();
    expect(stored!.responsibleTeam).toBe("Engineering Team");
  });

  it("should fail to create when vessel visit execution not found", async () => {
    const dto = {
      category: "Maintenance",
      responsibleTeam: "Engineering Team",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE999",
      suspendsOperations: false
    };

    const result = await service.createComplementaryTask(dto);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should create with optional endTime", async () => {
    vveRepo.addMock("VVE001");

    const dto = {
      category: "Inspection",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      endTime: new Date("2025-01-01T12:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    };

    const result = await service.createComplementaryTask(dto);

    expect(result.isSuccess).toBe(true);
    const task = await repo.findById("1");
    expect(task!.endTime).toEqual(new Date("2025-01-01T12:00:00Z"));
  });

  // ---------------------------------------------
  // UPDATE – aggregate flow
  // ---------------------------------------------
  it("should update task status to Completed with endTime", async () => {
    vveRepo.addMock("VVE001");

    const createDto = {
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    };

    const createResult = await service.createComplementaryTask(createDto);
    const taskId = createResult.getValue().id;

    const updateDto = {
      status: ComplementaryTaskStatus.Completed,
      endTime: new Date("2025-01-01T14:00:00Z")
    };

    const updateResult = await service.updateComplementaryTask(taskId, updateDto);

    expect(updateResult.isSuccess).toBe(true);
    
    const updated = await repo.findById(taskId);
    expect(updated!.status).toBe(ComplementaryTaskStatus.Completed);
    expect(updated!.endTime).toEqual(new Date("2025-01-01T14:00:00Z"));
  });

  it("should fail to update non-existent task", async () => {
    const updateDto = {
      status: ComplementaryTaskStatus.Completed,
      endTime: new Date("2025-01-01T14:00:00Z")
    };

    const result = await service.updateComplementaryTask("999", updateDto);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should update only endTime", async () => {
    vveRepo.addMock("VVE001");

    const createDto = {
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    };

    const createResult = await service.createComplementaryTask(createDto);
    const taskId = createResult.getValue().id;

    const updateDto = {
      endTime: new Date("2025-01-01T15:00:00Z")
    };

    const updateResult = await service.updateComplementaryTask(taskId, updateDto);

    expect(updateResult.isSuccess).toBe(true);
    
    const updated = await repo.findById(taskId);
    expect(updated!.endTime).toEqual(new Date("2025-01-01T15:00:00Z"));
    expect(updated!.status).toBe(ComplementaryTaskStatus.Ongoing);
  });

  // ---------------------------------------------
  // GET operations
  // ---------------------------------------------
  it("should get task by ID", async () => {
    vveRepo.addMock("VVE001");

    const createDto = {
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    };

    const createResult = await service.createComplementaryTask(createDto);
    const taskId = createResult.getValue().id;

    const getResult = await service.getComplementaryTaskById(taskId);

    expect(getResult.isSuccess).toBe(true);
    expect(getResult.getValue().id).toBe(taskId);
  });

  it("should return all tasks", async () => {
    vveRepo.addMock("VVE001");
    vveRepo.addMock("VVE002");

    await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    await service.createComplementaryTask({
      category: "Inspection",
      responsibleTeam: "Team B",
      startTime: new Date("2025-01-01T11:00:00Z"),
      vesselVisitExecutionCode: "VVE002",
      suspendsOperations: true
    });

    const result = await service.getAllComplementaryTasks();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
  });

  it("should get tasks by vessel visit execution code", async () => {
    vveRepo.addMock("VVE001");
    vveRepo.addMock("VVE002");

    await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    await service.createComplementaryTask({
      category: "Inspection",
      responsibleTeam: "Team B",
      startTime: new Date("2025-01-01T11:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: true
    });

    await service.createComplementaryTask({
      category: "Repair",
      responsibleTeam: "Team C",
      startTime: new Date("2025-01-01T12:00:00Z"),
      vesselVisitExecutionCode: "VVE002",
      suspendsOperations: false
    });

    const result = await service.getComplementaryTasksByVesselVisit("VVE001");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    result.getValue().forEach(task => {
      expect(task.vesselVisitExecutionCode).toBe("VVE001");
    });
  });

  it("should get tasks by status", async () => {
    vveRepo.addMock("VVE001");

    const task1 = await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    const task2 = await service.createComplementaryTask({
      category: "Inspection",
      responsibleTeam: "Team B",
      startTime: new Date("2025-01-01T11:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    // Complete one task
    await service.updateComplementaryTask(task1.getValue().id, {
      status: ComplementaryTaskStatus.Completed,
      endTime: new Date("2025-01-01T12:00:00Z")
    });

    const ongoingResult = await service.getComplementaryTasksByStatus(ComplementaryTaskStatus.Ongoing);
    expect(ongoingResult.isSuccess).toBe(true);
    expect(ongoingResult.getValue()).toHaveLength(1);

    const completedResult = await service.getComplementaryTasksByStatus(ComplementaryTaskStatus.Completed);
    expect(completedResult.isSuccess).toBe(true);
    expect(completedResult.getValue()).toHaveLength(1);
  });

  it("should get tasks by date range", async () => {
    vveRepo.addMock("VVE001");

    await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    await service.createComplementaryTask({
      category: "Inspection",
      responsibleTeam: "Team B",
      startTime: new Date("2025-01-15T11:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    await service.createComplementaryTask({
      category: "Repair",
      responsibleTeam: "Team C",
      startTime: new Date("2025-02-01T12:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    const result = await service.getComplementaryTasksByDateRange(
      new Date("2025-01-01"),
      new Date("2025-01-31")
    );

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
  });

  it("should get ongoing tasks that suspend operations", async () => {
    vveRepo.addMock("VVE001");

    await service.createComplementaryTask({
      category: "Emergency Repair",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: true
    });

    await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team B",
      startTime: new Date("2025-01-01T11:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    const task3 = await service.createComplementaryTask({
      category: "Critical Inspection",
      responsibleTeam: "Team C",
      startTime: new Date("2025-01-01T12:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: true
    });

    // Complete one impacting task
    await service.updateComplementaryTask(task3.getValue().id, {
      status: ComplementaryTaskStatus.Completed,
      endTime: new Date("2025-01-01T13:00:00Z")
    });

    const result = await service.getOngoingTasksThatSuspendOperations();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(1); // Only 1 ongoing task that suspends operations
    expect(result.getValue()[0].suspendsOperations).toBe(true);
    expect(result.getValue()[0].status).toBe(ComplementaryTaskStatus.Ongoing);
  });

  // ---------------------------------------------
  // DELETE – aggregate flow
  // ---------------------------------------------
  it("should delete a task successfully", async () => {
    vveRepo.addMock("VVE001");

    const createResult = await service.createComplementaryTask({
      category: "Maintenance",
      responsibleTeam: "Team A",
      startTime: new Date("2025-01-01T10:00:00Z"),
      vesselVisitExecutionCode: "VVE001",
      suspendsOperations: false
    });

    const taskId = createResult.getValue().id;

    const deleteResult = await service.deleteComplementaryTask(taskId);

    expect(deleteResult.isSuccess).toBe(true);

    const findResult = await service.getComplementaryTaskById(taskId);
    expect(findResult.isFailure).toBe(true);
  });

  it("should fail to delete non-existent task", async () => {
    const result = await service.deleteComplementaryTask("999");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });
});
