# US 4.1.4

## 1. Context

*This user story addresses the need for operational flexibility in logistics planning, enabling Logistics Operators to manually update an existing Operation Plan for a given VVN when last-minute changes occur. Through dedicated REST API update endpoints and an editable SPA interface, operators can adjust critical planning elements such as crane allocation, scheduling, and staff assignment.*

## 2. Requirements

**US 4.1.4** As a Logistics Operator, I want to manually update the Operation Plan of a given VVN, so that last-minute adjustments (e.g., resource or timing changes) can be made when needed.

**Acceptance Criteria:**

- The REST API must provide update endpoints.

- The SPA must allow editing key plan fields (e.g., crane assignment, start/end time, staff).

- Changes must be validated and logged (date, author, reason for change).

- The system must alert the user if the updated plans introduce possible inconsistencies with related VVNs and resource availability (e.g., cranes or staff).

**Dependencies/References:**

*This user story depends on US4.1.2 because to be able to update Operation plans, they already must be created.*


**Forum Insight:**

*There are no forum insights related to this User Story!*


## 3. Analysis

Operation Plan Update

![System Sequence Diagram ](images/system-sequence-diagram-US4.1.4.png)

## 4. C4 Model


#### Components - Level 3

![Components](images/components_lvl3.png)

#### Code - Level 4

![Code](images/code_lvl4.png)


## 5. Tests

### Application (controller)
```ts
describe("OperationPlan Routes - Missing Plans Tests (Application Tests)", () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  // =========================================
  // GET /operation-plans/missing
  // =========================================
  describe("GET /operation-plans/missing", () => {
    it("should return 200 and list of VVNs without operation plans", async () => {
      // Arrange
      const mockVvns = [
        { 
          code: "2026-PA-000001", 
          vessel: { vesselName: "Vessel A" }, 
          eta: "2026-01-15T10:00:00Z",
          estimatedCargoOperations: 10
        },
        { 
          code: "2026-PA-000002", 
          vessel: { vesselName: "Vessel B" }, 
          eta: "2026-01-15T14:00:00Z",
          estimatedCargoOperations: 15
        }
      ];

      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockVvns
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(200);

      // Assert
      expect(res.body).toEqual(mockVvns);
      expect(operationPlanServiceMock.getVvnsWithoutOperationPlan).toHaveBeenCalledTimes(1);
    });

    it("should return 200 with empty array when all VVNs have plans", async () => {
      // Arrange
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(200);

      // Assert
      expect(res.body).toEqual([]);
    });

    it("should return 500 when service fails", async () => {
      // Arrange
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Service Error",
        errorValue: () => "Service Error"
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(500);

      // Assert
      expect(res.body).toHaveProperty("error", "Service Error");
    });

    it("should pass authorization header to service", async () => {
      // Arrange
      const authToken = "Bearer test-token";
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      await request(app)
        .get("/operation-plans/missing")
        .set("Authorization", authToken)
        .expect(200);

      // Assert
      expect(operationPlanServiceMock.getVvnsWithoutOperationPlan).toHaveBeenCalledWith(authToken);
    });
  });

  // =========================================
  // GET /operation-plans
  // =========================================
  describe("GET /operation-plans", () => {
    it("should return 200 with list of plans", async () => {
      operationPlanServiceMock.getAllOperationPlans.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ id: "1", vvn: "VVN-1" }]
      });

      const res = await request(app)
        .get("/operation-plans")
        .expect(200);

      expect(res.body).toEqual([{ id: "1", vvn: "VVN-1" }]);
      expect(operationPlanServiceMock.getAllOperationPlans).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when service fails", async () => {
      operationPlanServiceMock.getAllOperationPlans.mockResolvedValue({
        isSuccess: false,
        error: "Service error"
      });

      const res = await request(app)
        .get("/operation-plans")
        .expect(500);

      expect(res.body).toHaveProperty("error", "Service error");
    });
  });

  // =========================================
  // GET /operation-plans/id/:id
  // =========================================
  describe("GET /operation-plans/id/:id", () => {
    it("should return 200 when found", async () => {
      operationPlanServiceMock.getOperationPlanById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ id: "123", vvn: "VVN-1" })
      });

      const res = await request(app)
        .get("/operation-plans/id/123")
        .expect(200);

      expect(res.body.id).toBe("123");
    });

    it("should return 404 when not found", async () => {
      operationPlanServiceMock.getOperationPlanById.mockResolvedValue({
        isSuccess: false,
        error: "not found"
      });

      const res = await request(app)
        .get("/operation-plans/id/NOPE")
        .expect(404);

      expect(res.body).toHaveProperty("error", "not found");
    });
  });

  // =========================================
  // GET /operation-plans/vvn/:vvn
  // =========================================
  describe("GET /operation-plans/vvn/:vvn", () => {
    it("should return 200 when found", async () => {
      operationPlanServiceMock.getOperationPlansByVvn.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ vvn: "VVN-1" }]
      });

      const res = await request(app)
        .get("/operation-plans/vvn/VVN-1")
        .expect(200);

      expect(res.body[0].vvn).toBe("VVN-1");
    });

    it("should return 404 when not found", async () => {
      operationPlanServiceMock.getOperationPlansByVvn.mockResolvedValue({
        isSuccess: false,
        error: "not found"
      });

      const res = await request(app)
        .get("/operation-plans/vvn/NOPE")
        .expect(404);

      expect(res.body).toHaveProperty("error", "not found");
    });
  });

  // =========================================
  // GET /operation-plans/target-day/:targetDay
  // =========================================
  describe("GET /operation-plans/target-day/:targetDay", () => {
    it("should return 200 when found", async () => {
      operationPlanServiceMock.getOperationPlansByTargetDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ vvn: "VVN-1" }]
      });

      const res = await request(app)
        .get("/operation-plans/target-day/2026-01-01")
        .expect(200);

      expect(res.body).toHaveLength(1);
    });

    it("should return 404 when not found", async () => {
      operationPlanServiceMock.getOperationPlansByTargetDay.mockResolvedValue({
        isSuccess: false,
        error: "not found"
      });

      const res = await request(app)
        .get("/operation-plans/target-day/2026-01-01")
        .expect(404);

      expect(res.body).toHaveProperty("error", "not found");
    });
  });

  // =========================================
  // GET /operation-plans/author/:author
  // =========================================
  describe("GET /operation-plans/author/:author", () => {
    it("should return 200 when found", async () => {
      operationPlanServiceMock.getOperationPlansByAuthor.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ author: "alice" }]
      });

      const res = await request(app)
        .get("/operation-plans/author/alice")
        .expect(200);

      expect(res.body[0].author).toBe("alice");
    });

    it("should return 404 when not found", async () => {
      operationPlanServiceMock.getOperationPlansByAuthor.mockResolvedValue({
        isSuccess: false,
        error: "not found"
      });

      const res = await request(app)
        .get("/operation-plans/author/missing")
        .expect(404);

      expect(res.body).toHaveProperty("error", "not found");
    });
  });

  // =========================================
  // GET /operation-plans/algorithm/:algorithm
  // =========================================
  describe("GET /operation-plans/algorithm/:algorithm", () => {
    it("should return 200 when found", async () => {
      operationPlanServiceMock.getOperationPlansByAlgorithm.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ algorithm: "genetic" }]
      });

      const res = await request(app)
        .get("/operation-plans/algorithm/genetic")
        .expect(200);

      expect(res.body[0].algorithm).toBe("genetic");
    });

    it("should return 404 when not found", async () => {
      operationPlanServiceMock.getOperationPlansByAlgorithm.mockResolvedValue({
        isSuccess: false,
        error: "not found"
      });

      const res = await request(app)
        .get("/operation-plans/algorithm/missing")
        .expect(404);

      expect(res.body).toHaveProperty("error", "not found");
    });
  });

  // =========================================
  // GET /operation-plans/search
  // =========================================
  describe("GET /operation-plans/search", () => {
    it("should return 200 with filtered plans", async () => {
      operationPlanServiceMock.searchOperationPlans.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ vvn: "VVN-SEARCH" }]
      });

      const res = await request(app)
        .get("/operation-plans/search?startDate=2026-01-01&endDate=2026-01-02&vvn=VVN-SEARCH")
        .expect(200);

      expect(operationPlanServiceMock.searchOperationPlans).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        "VVN-SEARCH"
      );
      expect(res.body[0].vvn).toBe("VVN-SEARCH");
    });

    it("should return 500 when service fails", async () => {
      operationPlanServiceMock.searchOperationPlans.mockResolvedValue({
        isSuccess: false,
        error: "search error"
      });

      const res = await request(app)
        .get("/operation-plans/search")
        .expect(500);

      expect(res.body).toHaveProperty("error", "search error");
    });
  });

```