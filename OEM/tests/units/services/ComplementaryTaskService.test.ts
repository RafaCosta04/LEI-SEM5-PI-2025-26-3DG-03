import { Result } from "../../../src/core/logic/Result";
import { ComplementaryTask } from "../../../src/domain/ComplementaryTask";
import { ComplementaryTaskStatus } from "../../../src/domain/ComplementaryTaskEnums";

// --- MOCKS ---
jest.mock("../../../src/mappers/ComplementaryTaskMap", () => ({
    ComplementaryTaskMap: {
        toDTO: jest.fn(),
        toDomain: jest.fn(),
        toPersistence: jest.fn()
    }
}));

import ComplementaryTaskService from "../../../src/services/ComplementaryTaskService";
import { ComplementaryTaskMap } from "../../../src/mappers/ComplementaryTaskMap";

describe("ComplementaryTaskService (unit tests)", () => {

    let complementaryTaskRepo: any;
    let vesselVisitExecutionRepo: any;
    let logger: any;
    let service: ComplementaryTaskService;

    beforeEach(() => {
        complementaryTaskRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByVesselVisitExecutionCode: jest.fn(),
            findByStatus: jest.fn(),
            findByDateRange: jest.fn(),
            findOngoingThatSuspendOperations: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        vesselVisitExecutionRepo = {
            findByCode: jest.fn()
        };

        logger = { error: jest.fn(), info: jest.fn() };

        service = new ComplementaryTaskService(
            complementaryTaskRepo,
            vesselVisitExecutionRepo,
            logger
        );
    });

    // ---------------------------------------------------
    // createComplementaryTask
    // ---------------------------------------------------

    it("should create a complementary task successfully", async () => {
        const vveMock = { code: "VVE001" };
        vesselVisitExecutionRepo.findByCode.mockResolvedValue(vveMock);

        const savedTask = new ComplementaryTask(
            "1",
            "Maintenance",
            "Engineering Team",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.save.mockResolvedValue(savedTask);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({
            id: "1",
            category: "Maintenance",
            responsibleTeam: "Engineering Team",
            status: "Ongoing",
            vesselVisitExecutionCode: "VVE001"
        });

        const dto = {
            category: "Maintenance",
            responsibleTeam: "Engineering Team",
            startTime: new Date("2025-01-01T10:00:00Z"),
            vesselVisitExecutionCode: "VVE001",
            suspendsOperations: false
        };

        const result = await service.createComplementaryTask(dto);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().id).toBe("1");
        expect(vesselVisitExecutionRepo.findByCode).toHaveBeenCalledWith("VVE001");
        expect(complementaryTaskRepo.save).toHaveBeenCalled();
    });

    it("should fail when vessel visit execution not found", async () => {
        vesselVisitExecutionRepo.findByCode.mockResolvedValue(null);

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
        expect(complementaryTaskRepo.save).not.toHaveBeenCalled();
    });

    it("should fail when repository throws error", async () => {
        const vveMock = { code: "VVE001" };
        vesselVisitExecutionRepo.findByCode.mockResolvedValue(vveMock);
        complementaryTaskRepo.save.mockRejectedValue(new Error("DB error"));

        const dto = {
            category: "Maintenance",
            responsibleTeam: "Engineering Team",
            startTime: new Date("2025-01-01T10:00:00Z"),
            vesselVisitExecutionCode: "VVE001",
            suspendsOperations: false
        };

        const result = await service.createComplementaryTask(dto);

        expect(result.isFailure).toBe(true);
        expect(logger.error).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // updateComplementaryTask
    // ---------------------------------------------------

    it("should update a complementary task successfully", async () => {
        const existingTask = new ComplementaryTask(
            "1",
            "Maintenance",
            "Engineering Team",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.findById.mockResolvedValue(existingTask);

        const updatedTask = new ComplementaryTask(
            "1",
            "Maintenance",
            "Engineering Team",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Completed,
            "VVE001",
            false,
            new Date("2025-01-01T12:00:00Z")
        );

        complementaryTaskRepo.update.mockResolvedValue(updatedTask);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({
            id: "1",
            status: "Completed",
            endTime: new Date("2025-01-01T12:00:00Z")
        });

        const dto = {
            status: ComplementaryTaskStatus.Completed,
            endTime: new Date("2025-01-01T12:00:00Z")
        };

        const result = await service.updateComplementaryTask("1", dto);

        expect(result.isSuccess).toBe(true);
        expect(complementaryTaskRepo.update).toHaveBeenCalled();
    });

    it("should fail when task not found", async () => {
        complementaryTaskRepo.findById.mockResolvedValue(null);

        const dto = {
            status: ComplementaryTaskStatus.Completed
        };

        const result = await service.updateComplementaryTask("999", dto);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
        expect(complementaryTaskRepo.update).not.toHaveBeenCalled();
    });

    it("should fail when update returns null", async () => {
        const existingTask = new ComplementaryTask(
            "1",
            "Maintenance",
            "Engineering Team",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.findById.mockResolvedValue(existingTask);
        complementaryTaskRepo.update.mockResolvedValue(null);

        const dto = {
            status: ComplementaryTaskStatus.Completed,
            endTime: new Date("2025-01-01T12:00:00Z")
        };

        const result = await service.updateComplementaryTask("1", dto);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Failed to update");
    });

    // ---------------------------------------------------
    // getComplementaryTaskById
    // ---------------------------------------------------

    it("should return task DTO when task exists", async () => {
        const domainObj = new ComplementaryTask(
            "1",
            "Maintenance",
            "Engineering Team",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.findById.mockResolvedValue(domainObj);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({
            id: "1",
            category: "Maintenance"
        });

        const result = await service.getComplementaryTaskById("1");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().id).toBe("1");
    });

    it("should fail when task is not found by ID", async () => {
        complementaryTaskRepo.findById.mockResolvedValue(null);

        const result = await service.getComplementaryTaskById("999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });

    // ---------------------------------------------------
    // getAllComplementaryTasks
    // ---------------------------------------------------

    it("should return all tasks successfully", async () => {
        const task1 = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        const task2 = new ComplementaryTask(
            "2",
            "Inspection",
            "Team B",
            new Date("2025-01-01T11:00:00Z"),
            ComplementaryTaskStatus.Completed,
            "VVE002",
            true,
            new Date("2025-01-01T13:00:00Z")
        );

        complementaryTaskRepo.findAll.mockResolvedValue([task1, task2]);

        (ComplementaryTaskMap.toDTO as jest.Mock)
            .mockReturnValueOnce({ id: "1" })
            .mockReturnValueOnce({ id: "2" });

        const result = await service.getAllComplementaryTasks();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(2);
    });

    it("should fail when repository throws error", async () => {
        complementaryTaskRepo.findAll.mockRejectedValue(new Error("DB error"));

        const result = await service.getAllComplementaryTasks();

        expect(result.isFailure).toBe(true);
        expect(logger.error).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // getComplementaryTasksByVesselVisit
    // ---------------------------------------------------

    it("should return tasks for a specific vessel visit", async () => {
        const task = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.findByVesselVisitExecutionCode.mockResolvedValue([task]);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({ id: "1" });

        const result = await service.getComplementaryTasksByVesselVisit("VVE001");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(1);
        expect(complementaryTaskRepo.findByVesselVisitExecutionCode).toHaveBeenCalledWith("VVE001");
    });

    // ---------------------------------------------------
    // getComplementaryTasksByStatus
    // ---------------------------------------------------

    it("should return tasks with specific status", async () => {
        const task = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            false
        );

        complementaryTaskRepo.findByStatus.mockResolvedValue([task]);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({ id: "1", status: "Ongoing" });

        const result = await service.getComplementaryTasksByStatus(ComplementaryTaskStatus.Ongoing);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(1);
        expect(complementaryTaskRepo.findByStatus).toHaveBeenCalledWith(ComplementaryTaskStatus.Ongoing);
    });

    // ---------------------------------------------------
    // getComplementaryTasksByDateRange
    // ---------------------------------------------------

    it("should return tasks within date range", async () => {
        const task = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Completed,
            "VVE001",
            false,
            new Date("2025-01-01T12:00:00Z")
        );

        complementaryTaskRepo.findByDateRange.mockResolvedValue([task]);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({ id: "1" });

        const startDate = new Date("2025-01-01");
        const endDate = new Date("2025-01-31");

        const result = await service.getComplementaryTasksByDateRange(startDate, endDate);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(1);
        expect(complementaryTaskRepo.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
    });

    // ---------------------------------------------------
    // getOngoingTasksThatSuspendOperations
    // ---------------------------------------------------

    it("should return ongoing tasks that suspend operations", async () => {
        const task = new ComplementaryTask(
            "1",
            "Emergency Repair",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Ongoing,
            "VVE001",
            true
        );

        complementaryTaskRepo.findOngoingThatSuspendOperations.mockResolvedValue([task]);

        (ComplementaryTaskMap.toDTO as jest.Mock).mockReturnValue({ 
            id: "1", 
            suspendsOperations: true,
            status: "Ongoing"
        });

        const result = await service.getOngoingTasksThatSuspendOperations();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(1);
        expect(complementaryTaskRepo.findOngoingThatSuspendOperations).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // deleteComplementaryTask
    // ---------------------------------------------------

    it("should delete a complementary task successfully", async () => {
        const task = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Completed,
            "VVE001",
            false,
            new Date("2025-01-01T12:00:00Z")
        );

        complementaryTaskRepo.findById.mockResolvedValue(task);
        complementaryTaskRepo.delete.mockResolvedValue(true);

        const result = await service.deleteComplementaryTask("1");

        expect(result.isSuccess).toBe(true);
        expect(complementaryTaskRepo.delete).toHaveBeenCalledWith("1");
    });

    it("should fail when task to delete not found", async () => {
        complementaryTaskRepo.findById.mockResolvedValue(null);

        const result = await service.deleteComplementaryTask("999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
        expect(complementaryTaskRepo.delete).not.toHaveBeenCalled();
    });

    it("should fail when delete operation fails", async () => {
        const task = new ComplementaryTask(
            "1",
            "Maintenance",
            "Team A",
            new Date("2025-01-01T10:00:00Z"),
            ComplementaryTaskStatus.Completed,
            "VVE001",
            false,
            new Date("2025-01-01T12:00:00Z")
        );

        complementaryTaskRepo.findById.mockResolvedValue(task);
        complementaryTaskRepo.delete.mockResolvedValue(false);

        const result = await service.deleteComplementaryTask("1");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Failed to delete");
    });
});
