import { ComplementaryTask } from "../../../src/domain/ComplementaryTask";
import { ComplementaryTaskStatus } from "../../../src/domain/ComplementaryTaskEnums";

describe("ComplementaryTask (unit tests)", () => {

  const validData = {
    id: "1",
    category: "Maintenance",
    responsibleTeam: "Engineering Team",
    startTime: new Date("2025-01-01T10:00:00Z"),
    status: ComplementaryTaskStatus.Ongoing,
    vesselVisitExecutionCode: "VVE001",
    suspendsOperations: false,
    endTime: new Date("2025-01-01T12:00:00Z"),
    description: "Test task description"
  };

  // ------------------------------------------------------------
  // Constructor validation
  // ------------------------------------------------------------

  it("should create a ComplementaryTask with valid data", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      validData.status,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations,
      validData.endTime,
      validData.description
    );

    expect(task.id).toBe("1");
    expect(task.category).toBe("Maintenance");
    expect(task.responsibleTeam).toBe("Engineering Team");
    expect(task.startTime).toEqual(validData.startTime);
    expect(task.status).toBe(ComplementaryTaskStatus.Ongoing);
    expect(task.vesselVisitExecutionCode).toBe("VVE001");
    expect(task.suspendsOperations).toBe(false);
    expect(task.endTime).toEqual(validData.endTime);
    expect(task.description).toBe("Test task description");
  });

  it("should create a ComplementaryTask without optional fields", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      validData.status,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    expect(task.endTime).toBeUndefined();
    expect(task.description).toBeUndefined();
  });

  // ------------------------------------------------------------
  // Category validation
  // ------------------------------------------------------------

  it("should throw error if category is empty", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        "",
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Category cannot be null or empty.");
  });

  it("should throw error if category is null", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        null as any,
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Category cannot be null or empty.");
  });

  it("should throw error if category is only whitespace", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        "   ",
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Category cannot be null or empty.");
  });

  // ------------------------------------------------------------
  // Responsible Team validation
  // ------------------------------------------------------------

  it("should throw error if responsible team is empty", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        "",
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Responsible team cannot be null or empty.");
  });

  it("should throw error if responsible team is null", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        null as any,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Responsible team cannot be null or empty.");
  });

  it("should throw error if responsible team exceeds 200 characters", () => {
    const longTeam = "a".repeat(201);
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        longTeam,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Responsible team cannot exceed 200 characters.");
  });

  it("should accept responsible team with exactly 200 characters", () => {
    const maxTeam = "a".repeat(200);
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      maxTeam,
      validData.startTime,
      validData.status,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );
    expect(task.responsibleTeam).toBe(maxTeam);
  });

  // ------------------------------------------------------------
  // Start Time validation
  // ------------------------------------------------------------

  it("should throw error if start time is invalid", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        new Date("invalid"),
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Start time must be a valid date.");
  });

  it("should throw error if start time is not a Date object", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        "2025-01-01" as any,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Start time must be a valid date.");
  });

  // ------------------------------------------------------------
  // End Time validation
  // ------------------------------------------------------------

  it("should throw error if end time is invalid", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations,
        new Date("invalid")
      )
    ).toThrow("End time must be a valid date.");
  });

  it("should throw error if end time is before start time", () => {
    const startTime = new Date("2025-01-01T10:00:00Z");
    const endTime = new Date("2025-01-01T09:00:00Z");
    
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        startTime,
        validData.status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations,
        endTime
      )
    ).toThrow("End time cannot be before start time.");
  });

  it("should accept end time equal to start time", () => {
    const time = new Date("2025-01-01T10:00:00Z");
    
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      time,
      validData.status,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations,
      time
    );
    
    expect(task.endTime).toEqual(time);
  });

  // ------------------------------------------------------------
  // Status validation
  // ------------------------------------------------------------

  it("should throw error if status is invalid", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        validData.startTime,
        "InvalidStatus" as any,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      )
    ).toThrow("Invalid complementary task status.");
  });

  it("should accept all valid status values", () => {
    const statuses = [
      ComplementaryTaskStatus.Ongoing,
      ComplementaryTaskStatus.Completed,
      ComplementaryTaskStatus.Cancelled
    ];

    statuses.forEach(status => {
      const task = new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        validData.startTime,
        status,
        validData.vesselVisitExecutionCode,
        validData.suspendsOperations
      );
      expect(task.status).toBe(status);
    });
  });

  // ------------------------------------------------------------
  // Vessel Visit Execution Code validation
  // ------------------------------------------------------------

  it("should throw error if vessel visit execution code is empty", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        "",
        validData.suspendsOperations
      )
    ).toThrow("Vessel visit execution code cannot be null or empty.");
  });

  it("should throw error if vessel visit execution code is null", () => {
    expect(() =>
      new ComplementaryTask(
        validData.id,
        validData.category,
        validData.responsibleTeam,
        validData.startTime,
        validData.status,
        null as any,
        validData.suspendsOperations
      )
    ).toThrow("Vessel visit execution code cannot be null or empty.");
  });

  // ------------------------------------------------------------
  // updateStatus method
  // ------------------------------------------------------------

  it("should update status to Completed with end time", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    const endTime = new Date("2025-01-01T12:00:00Z");
    task.updateStatus(ComplementaryTaskStatus.Completed, endTime);

    expect(task.status).toBe(ComplementaryTaskStatus.Completed);
    expect(task.endTime).toEqual(endTime);
  });

  it("should throw error when completing task without end time", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    expect(() => {
      task.updateStatus(ComplementaryTaskStatus.Completed);
    }).toThrow("End time is required when completing a task.");
  });

  it("should update status to Cancelled without requiring end time", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    task.updateStatus(ComplementaryTaskStatus.Cancelled);

    expect(task.status).toBe(ComplementaryTaskStatus.Cancelled);
  });

  it("should throw error when updating to invalid status", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    expect(() => {
      task.updateStatus("InvalidStatus" as any);
    }).toThrow("Invalid complementary task status.");
  });

  // ------------------------------------------------------------
  // updateEndTime method
  // ------------------------------------------------------------

  it("should update end time when valid", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    const newEndTime = new Date("2025-01-01T14:00:00Z");
    task.updateEndTime(newEndTime);

    expect(task.endTime).toEqual(newEndTime);
  });

  it("should throw error when updating end time to before start time", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    const invalidEndTime = new Date("2025-01-01T09:00:00Z");

    expect(() => {
      task.updateEndTime(invalidEndTime);
    }).toThrow("End time cannot be before start time.");
  });

  // ------------------------------------------------------------
  // updateDescription method
  // ------------------------------------------------------------

  it("should update description when valid", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    task.updateDescription("New description");

    expect(task.description).toBe("New description");
  });

  it("should throw error when description exceeds 1000 characters", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    const longDescription = "a".repeat(1001);

    expect(() => {
      task.updateDescription(longDescription);
    }).toThrow("Description cannot exceed 1000 characters.");
  });

  it("should accept description with exactly 1000 characters", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    const maxDescription = "a".repeat(1000);
    task.updateDescription(maxDescription);

    expect(task.description).toBe(maxDescription);
  });

  // ------------------------------------------------------------
  // isImpactingOperations method
  // ------------------------------------------------------------

  it("should return true when task suspends operations and is Ongoing", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      true
    );

    expect(task.isImpactingOperations()).toBe(true);
  });

  it("should return false when task suspends operations but is Completed", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Completed,
      validData.vesselVisitExecutionCode,
      true,
      validData.endTime
    );

    expect(task.isImpactingOperations()).toBe(false);
  });

  it("should return false when task is Ongoing but does not suspend operations", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      false
    );

    expect(task.isImpactingOperations()).toBe(false);
  });

  it("should return false when task is Cancelled even if suspends operations", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Cancelled,
      validData.vesselVisitExecutionCode,
      true
    );

    expect(task.isImpactingOperations()).toBe(false);
  });

  // ------------------------------------------------------------
  // getDuration method
  // ------------------------------------------------------------

  it("should return duration in milliseconds when end time is set", () => {
    const startTime = new Date("2025-01-01T10:00:00Z");
    const endTime = new Date("2025-01-01T12:00:00Z");
    
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      startTime,
      ComplementaryTaskStatus.Completed,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations,
      endTime
    );

    const expectedDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    expect(task.getDuration()).toBe(expectedDuration);
  });

  it("should return null when end time is not set", () => {
    const task = new ComplementaryTask(
      validData.id,
      validData.category,
      validData.responsibleTeam,
      validData.startTime,
      ComplementaryTaskStatus.Ongoing,
      validData.vesselVisitExecutionCode,
      validData.suspendsOperations
    );

    expect(task.getDuration()).toBeNull();
  });
});
