import { ComplementaryTaskStatus } from "../domain/ComplementaryTaskEnums";

/**
 * components:
 *   schemas:
 *     ComplementaryTaskDTO:
 *       type: object
 *       required:
 *         - category
 *         - responsibleTeam
 *         - startTime
 *         - status
 *         - vesselVisitExecutionCode
 *         - suspendsOperations
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the complementary task
 *           example: "507f1f77bcf86cd799439011"
 *         category:
 *           type: string
 *           enum: [Inspection, Cleaning, Maintenance, SafetyProcedure, Refueling, CertificationCheck, Other]
 *           description: Category of the complementary task
 *           example: "Inspection"
 *         responsibleTeam:
 *           type: string
 *           description: Team or service responsible for the task
 *           example: "Port Safety Team"
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the task
 *           example: "2024-01-15T10:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: End time of the task (optional, required when status is Completed)
 *           example: "2024-01-15T12:00:00Z"
 *         status:
 *           type: string
 *           enum: [Ongoing, Completed, Cancelled]
 *           description: Current status of the task
 *           example: "Ongoing"
 *         vesselVisitExecutionCode:
 *           type: string
 *           description: Code of the vessel visit execution this task relates to
 *           example: "2025-PA-000123"
 *         suspendsOperations:
 *           type: boolean
 *           description: Whether this task suspends cargo operations
 *           example: false
 *         description:
 *           type: string
 *           description: Optional description or notes about the task
 *           example: "Routine safety inspection of cargo handling equipment"
 */

export interface ComplementaryTaskDTO {
    id?: string;
    category: string;
    responsibleTeam: string;
    startTime: Date | string;
    endTime?: Date | string;
    status: ComplementaryTaskStatus;
    vesselVisitExecutionCode: string;
    suspendsOperations: boolean;
    description?: string;
}

export interface CreateComplementaryTaskDTO {
    category: string;
    responsibleTeam: string;
    startTime: Date | string;
    endTime?: Date | string;
    vesselVisitExecutionCode: string;
    suspendsOperations: boolean;
    description?: string;
}

export interface UpdateComplementaryTaskDTO {
    category?: string;
    responsibleTeam?: string;
    endTime?: Date | string;
    status?: ComplementaryTaskStatus;
    suspendsOperations?: boolean;
    description?: string;
}
