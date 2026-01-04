import { Result } from "../../../src/core/logic/Result";
import { OperationPlan } from "../../../src/domain/OperationPlan";
import { OperationEntry } from "../../../src/domain/OperationEntry";

// --- MOCKS ---
jest.mock("../../../src/mappers/OperationPlanMap", () => ({
    OperationPlanMap: {
        toDTO: jest.fn(),
        toDomain: jest.fn(),
        toPersistence: jest.fn()
    }
}));

jest.mock("../../../src/mappers/OperationEntryMap", () => ({
    OperationEntryMap: {
        toDomain: jest.fn()
    }
}));

jest.mock("../../../src/services/clients/VesselVisitNotificationClient");
jest.mock("../../../src/services/clients/ScheduleClient");

import OperationPlanService from "../../../src/services/OperationPlanService";
import { OperationPlanMap } from "../../../src/mappers/OperationPlanMap";
import { OperationEntryMap } from "../../../src/mappers/OperationEntryMap";
import VesselVisitNotificationClient from "../../../src/services/clients/VesselVisitNotificationClient";
import ScheduleClient from "../../../src/services/clients/ScheduleClient";

describe("OperationPlanService - Missing Plans Tests (unit tests)", () => {

    let operationPlanRepo: any;
    let logger: any;
    let service: OperationPlanService;
    let vvnClientMock: jest.Mocked<VesselVisitNotificationClient>;
    let scheduleClientMock: jest.Mocked<ScheduleClient>;

    beforeEach(() => {
        operationPlanRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByVvn: jest.fn(),
            findByTargetDay: jest.fn(),
            findByArrivalTime: jest.fn(),
            findByDepartureTime: jest.fn(),
            findByAuthor: jest.fn(),
            findByAlgorithm: jest.fn(),
            findByDateRange: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

        service = new OperationPlanService(operationPlanRepo, logger);

        // Mock VesselVisitNotificationClient instance
        vvnClientMock = service['vvnClient'] as jest.Mocked<VesselVisitNotificationClient>;
        vvnClientMock.getAll = jest.fn();

        // Mock ScheduleClient instance
        scheduleClientMock = service['scheduleClient'] as jest.Mocked<ScheduleClient>;
        scheduleClientMock.getScheduleByTargetDay = jest.fn();

        (OperationEntryMap.toDomain as jest.Mock).mockImplementation((dto) => ({
            ...dto,
            operationStart: new Date(dto.operationStart),
            operationEnd: new Date(dto.operationEnd)
        }));

        // Reset mocks
        jest.clearAllMocks();
    });

    // ---------------------------------------------------
    // getVvnsWithoutOperationPlan
    // ---------------------------------------------------

    describe("getVvnsWithoutOperationPlan", () => {
        it("should return VVNs that don't have operation plans", async () => {
            // Arrange: Mock VVN client to return 3 VVNs
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000002", vessel: { vesselName: "Vessel B" }, eta: "2026-01-15T14:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000003", vessel: { vesselName: "Vessel C" }, eta: "2026-01-16T09:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);

            // Mock repository to return only one existing plan for VVN-001
            const mockOperationPlans = [
                {
                    id: "plan-1",
                    vvn: "2026-PA-000001",
                    TargetDay: new Date("2026-01-15"),
                    operations: []
                }
            ];

            operationPlanRepo.findAll.mockResolvedValue(mockOperationPlans);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(2);
            expect(result.getValue()[0].code).toBe("2026-PA-000002");
            expect(result.getValue()[1].code).toBe("2026-PA-000003");
            expect(logger.info).toHaveBeenCalledWith('Fetched 3 VVNs from API');
            expect(logger.info).toHaveBeenCalledWith('Found 2 approved VVNs without operation plans');
        });

        it("should return all VVNs when no operation plans exist", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000002", vessel: { vesselName: "Vessel B" }, eta: "2026-01-15T14:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(2);
        });

        it("should return empty array when all VVNs have operation plans", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" }
            ];

            const mockOperationPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockOperationPlans);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(0);
        });

        it("should handle errors when fetching VVNs fails", async () => {
            // Arrange
            vvnClientMock.getAll.mockRejectedValue(new Error("API Error"));

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving VVNs without operation plans.");
            expect(logger.error).toHaveBeenCalled();
        });

        it("should handle errors when fetching operation plans fails", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockRejectedValue(new Error("Database Error"));

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isFailure).toBe(true);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // getAllOperationPlans
    // ---------------------------------------------------

    describe("getAllOperationPlans", () => {
        it("should return mapped list on success", async () => {
            const domainPlan = { id: "1" } as any;
            operationPlanRepo.findAll.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "1" });

            const result = await service.getAllOperationPlans();

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "1" }]);
            expect(operationPlanRepo.findAll).toHaveBeenCalled();
        });

        it("should fail when repo throws", async () => {
            operationPlanRepo.findAll.mockRejectedValue(new Error("DB"));

            const result = await service.getAllOperationPlans();

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plans.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // getOperationPlanById
    // ---------------------------------------------------

    describe("getOperationPlanById", () => {
        it("should return DTO when found", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findById.mockResolvedValue(domainPlan);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.getOperationPlanById("p1");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({ id: "p1" });
        });

        it("should fail when not found", async () => {
            operationPlanRepo.findById.mockResolvedValue(null);

            const result = await service.getOperationPlanById("missing");

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Operation plan not found.");
        });

        it("should fail when repo throws", async () => {
            operationPlanRepo.findById.mockRejectedValue(new Error("boom"));

            const result = await service.getOperationPlanById("p1");

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plan.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // getOperationPlansByVvn / TargetDay / Author / Algorithm
    // ---------------------------------------------------

    describe("getOperationPlansByVvn", () => {
        it("should return mapped array when found", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByVvn.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.getOperationPlansByVvn("VVN");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should return empty array when none", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue(null);

            const result = await service.getOperationPlansByVvn("NONE");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([]);
        });

        it("should fail on repo error", async () => {
            operationPlanRepo.findByVvn.mockRejectedValue(new Error("err"));

            const result = await service.getOperationPlansByVvn("X");

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plans by VVN.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("getOperationPlansByTargetDay", () => {
        it("should return mapped array", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByTargetDay.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.getOperationPlansByTargetDay(new Date());

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should return empty array when repo returns null", async () => {
            operationPlanRepo.findByTargetDay.mockResolvedValue(null);

            const result = await service.getOperationPlansByTargetDay(new Date());

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([]);
        });

        it("should fail on repo error", async () => {
            operationPlanRepo.findByTargetDay.mockRejectedValue(new Error("err"));

            const result = await service.getOperationPlansByTargetDay(new Date());

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plans by target day.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("getOperationPlansByAuthor", () => {
        it("should map results", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByAuthor.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.getOperationPlansByAuthor("me");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should fail on error", async () => {
            operationPlanRepo.findByAuthor.mockRejectedValue(new Error("err"));

            const result = await service.getOperationPlansByAuthor("me");

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plans by author.");
        });
    });

    describe("getOperationPlansByAlgorithm", () => {
        it("should map results", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByAlgorithm.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.getOperationPlansByAlgorithm("alg");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should fail on error", async () => {
            operationPlanRepo.findByAlgorithm.mockRejectedValue(new Error("err"));

            const result = await service.getOperationPlansByAlgorithm("alg");

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving operation plans by algorithm.");
        });
    });

    // ---------------------------------------------------
    // searchOperationPlans
    // ---------------------------------------------------

    describe("searchOperationPlans", () => {
        it("should search by date range", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByDateRange.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.searchOperationPlans(new Date(), new Date(), "VVN");

            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.findByDateRange).toHaveBeenCalled();
        });

        it("should search by VVN when only vvn provided", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findByVvn.mockResolvedValue(domainPlan);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.searchOperationPlans(undefined, undefined, "VVN");

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should return all when no filters", async () => {
            const domainPlan = { id: "p1" } as any;
            operationPlanRepo.findAll.mockResolvedValue([domainPlan]);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.searchOperationPlans();

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual([{ id: "p1" }]);
        });

        it("should fail on error", async () => {
            operationPlanRepo.findAll.mockRejectedValue(new Error("err"));

            const result = await service.searchOperationPlans();

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error searching operation plans.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // create
    // ---------------------------------------------------

    describe("create", () => {
        const baseDto: any = {
            vvn: "VVN-1",
            targetDay: new Date("2026-01-01"),
            arrivalTime: new Date("2026-01-01T07:00:00Z"),
            departureTime: new Date("2026-01-01T19:00:00Z"),
            operations: [],
            author: "user",
            algorithm: "genetic"
        };

        it("should create when no conflicts", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue(null);
            operationPlanRepo.findByTargetDay.mockResolvedValue(null);

            const domainPlan = { id: "p1" } as any;
            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue(domainPlan);
            operationPlanRepo.save.mockResolvedValue(domainPlan);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "p1" });

            const result = await service.create(baseDto);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({ id: "p1" });
        });

        it("should fail when VVN already exists", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue({ id: "exists" });

            const result = await service.create(baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain("already exists");
        });

        it("should fail when target day conflicts", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue(null);
            operationPlanRepo.findByTargetDay.mockResolvedValue({ id: "p" });

            const result = await service.create(baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain("same target day");
        });

        it("should fail when save returns null", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue(null);
            operationPlanRepo.findByTargetDay.mockResolvedValue(null);
            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue({});
            operationPlanRepo.save.mockResolvedValue(null);

            const result = await service.create(baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Failed to create operation plan.");
        });

        it("should fail when repo throws", async () => {
            operationPlanRepo.findByVvn.mockRejectedValue(new Error("err"));

            const result = await service.create(baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error creating operation plan.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // update
    // ---------------------------------------------------

    describe("update", () => {
        const createExistingPlan = () => {
            return new OperationPlan(
                "plan-1",
                "VVN-1",
                new Date("2026-01-01"),
                new Date("2026-01-01T07:00:00Z"),
                new Date("2026-01-01T18:00:00Z"),
                [
                    new OperationEntry(
                        "op-1",
                        "LOAD",
                        "CONT-1",
                        new Date("2026-01-01T08:00:00Z"),
                        new Date("2026-01-01T09:00:00Z"),
                        "CR-1"
                    )
                ],
                "author-1",
                "algo-1",
                new Date("2025-12-31T23:00:00Z")
            );
        };

        const baseDto: any = {
            id: "plan-1",
            vvn: "VVN-1",
            targetDay: new Date("2026-01-02"),
            arrivalTime: new Date("2026-01-02T07:00:00Z"),
            departureTime: new Date("2026-01-02T18:00:00Z"),
            operations: [
                {
                    id: "op-1",
                    operationType: "LOAD",
                    container: "C1",
                    operationStart: new Date("2026-01-02T08:00:00Z"),
                    operationEnd: new Date("2026-01-02T10:00:00Z"),
                    craneUsed: "CR-1"
                }
            ],
            author: "author-2",
            algorithm: "algo-2",
            createdAt: new Date("2025-12-31T23:00:00Z"),
            changeReason: "Adjust"
        };

        it("should update successfully and append change log", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);
            operationPlanRepo.update.mockResolvedValue(existing);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "plan-1" });

            const result = await service.update("VVN-1", baseDto);

            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.update).toHaveBeenCalled();
            expect(existing.changeLog.length).toBeGreaterThan(0);
        });

        it("should fail when plan not found", async () => {
            operationPlanRepo.findByVvn.mockResolvedValue(null);

            const result = await service.update("VVN-1", baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Operation plan not found.");
        });

        it("should fail when VVN changes", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);

            const result = await service.update("VVN-1", { ...baseDto, vvn: "OTHER" });

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Vessel Visit Notification number cannot be changed.");
        });

        it("should fail when changeReason missing", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);

            const result = await service.update("VVN-1", { ...baseDto, changeReason: "" });

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Change reason is required for updates.");
        });

        it("should fail when last operation ends after departure", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);

            const badDto = { ...baseDto, departureTime: new Date("2026-01-02T08:30:00Z") };

            const result = await service.update("VVN-1", badDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("The last operation cannot end after the departure time.");
        });

        it("should fail when any operation has invalid times", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);

            const badDto = {
                ...baseDto,
                operations: [
                    {
                        id: "op-1",
                        operationType: "LOAD",
                        container: "C1",
                        operationStart: new Date("2026-01-02T10:00:00Z"),
                        operationEnd: new Date("2026-01-02T09:00:00Z"),
                        craneUsed: "CR-1"
                    }
                ]
            };

            const result = await service.update("VVN-1", badDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain("Start time must be before end time.");
        });

        it("should wrap validation errors from domain", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);

            const result = await service.update("VVN-1", { ...baseDto, author: "" });

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toContain("Validation error");
        });

        it("should fail when repo update returns null", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);
            operationPlanRepo.update.mockResolvedValue(null);

            const result = await service.update("VVN-1", baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Failed to update operation plan.");
        });

        it("should fail when repo throws", async () => {
            const existing = createExistingPlan();
            operationPlanRepo.findByVvn.mockResolvedValue(existing);
            operationPlanRepo.update.mockRejectedValue(new Error("err"));

            const result = await service.update("VVN-1", baseDto);

            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error updating operation plan.");
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // regenerateOperationPlansForDay
    // ---------------------------------------------------

    describe("regenerateOperationPlansForDay", () => {
        it("should regenerate plans for all VVNs on a specific date", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "genetic";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                },
                {
                    code: "2026-PA-000002",
                    vessel: { vesselName: "Vessel B" },
                    eta: "2026-01-15T14:00:00Z",
                    etd: "2026-01-15T22:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockResolvedValue(true);

            // Mock schedule response
            scheduleClientMock.getScheduleByTargetDay.mockResolvedValue({
                schedule: {
                    schedule: [
                        { vessel: "Vessel A", craneNames: ["CRANE-1", "CRANE-2"] },
                        { vessel: "Vessel B", craneNames: ["CRANE-3", "CRANE-4"] }
                    ]
                }
            } as any);

            const mockDomainPlan = {
                id: "new-plan-1",
                vvn: "2026-PA-000001",
                TargetDay: targetDate,
                operations: []
            };

            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue(mockDomainPlan);
            operationPlanRepo.save.mockResolvedValue(mockDomainPlan);

            (OperationPlanMap.toDTO as jest.Mock).mockImplementation((plan) => ({
                id: plan.id,
                vvn: plan.vvn,
                targetDay: plan.TargetDay,
                operations: plan.operations
            }));

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.delete).toHaveBeenCalledWith("plan-1");
            expect(logger.info).toHaveBeenCalledWith('Regenerating operation plans for day: 2026-01-15T00:00:00.000Z');
            expect(logger.info).toHaveBeenCalledWith('Found 2 VVNs for day 2026-01-15T00:00:00.000Z');
        });

        it("should return empty array when no VVNs exist for the day", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "default";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-16T10:00:00Z", // Different day
                    etd: "2026-01-16T18:00:00Z",
                    cargoManifests: []
                }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(0);
            expect(logger.info).toHaveBeenCalledWith('Found 0 VVNs for day 2026-01-15T00:00:00.000Z');
        });

        it("should delete existing plans before creating new ones", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "improved";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "old-plan-1", vvn: "2026-PA-000001", operations: [] },
                { id: "other-plan", vvn: "2026-PA-000099", operations: [] } // Different VVN
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockResolvedValue(true);

            // Mock schedule response
            scheduleClientMock.getScheduleByTargetDay.mockResolvedValue({
                schedule: {
                    schedule: [
                        { vessel: "Vessel A", craneNames: ["CRANE-1"] }
                    ]
                }
            } as any);

            const mockDomainPlan = {
                id: "new-plan-1",
                vvn: "2026-PA-000001",
                TargetDay: targetDate,
                operations: []
            };

            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue(mockDomainPlan);
            operationPlanRepo.save.mockResolvedValue(mockDomainPlan);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "new-plan-1" });

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.delete).toHaveBeenCalledTimes(1);
            expect(operationPlanRepo.delete).toHaveBeenCalledWith("old-plan-1");
            expect(operationPlanRepo.delete).not.toHaveBeenCalledWith("other-plan");
            expect(logger.info).toHaveBeenCalledWith('Deleted existing operation plan old-plan-1 for VVN 2026-PA-000001');
        });

        it("should handle errors when deleting plans fails", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "automatic";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockRejectedValue(new Error("Delete failed"));

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isFailure).toBe(true);
            expect(logger.error).toHaveBeenCalled();
        });

        it("should create plans with correct metadata", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "genetic";
            const author = "logistics-operator-1";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            // Mock schedule response
            scheduleClientMock.getScheduleByTargetDay.mockResolvedValue({
                schedule: {
                    schedule: [
                        { vessel: "Vessel A", craneNames: ["CRANE-1"] }
                    ]
                }
            } as any);

            let capturedDomainArg: any;
            (OperationPlanMap.toDomain as jest.Mock).mockImplementation((arg) => {
                capturedDomainArg = arg;
                return {
                    id: "new-plan",
                    vvn: arg.vvn,
                    TargetDay: arg.TargetDay,
                    operations: arg.operations,
                    author: arg.author,
                    algorithm: arg.algorithm
                };
            });

            operationPlanRepo.save.mockResolvedValue({ id: "new-plan" });
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "new-plan" });

            // Act
            await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(capturedDomainArg).toBeDefined();
            expect(capturedDomainArg.author).toBe(author);
            expect(capturedDomainArg.algorithm).toBe(algorithm);
            expect(capturedDomainArg.createdAt).toBeInstanceOf(Date);
        });
    });
});
