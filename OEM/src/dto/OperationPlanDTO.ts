import { OperationEntryDTO } from "./OperationEntryDTO";

/**
 * @swagger
 * components:
 *   schemas:
 *     OperationPlanDTO:
 *       type: object
 *       required:
 *         - vvn
 *         - targetDay
 *         - arrivalTime
 *         - departureTime
 *         - operations
 *         - author
 *         - algorithm
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID
 *           example: "507f1f77bcf86cd799439012"
 *         vvn:
 *           type: string
 *           description: Vessel Visit Notification
 *           example: "VVN2025-001"
 *         targetDay:
 *           type: string
 *           format: date
 *           description: Target day for the operation plan
 *           example: "2025-01-10"
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *           description: Vessel arrival time
 *           example: "2025-01-10T06:00:00Z"
 *         departureTime:
 *           type: string
 *           format: date-time
 *           description: Vessel departure time
 *           example: "2025-01-10T18:00:00Z"
 *         operations:
 *           type: array
 *           description: List of operation entries
 *           items:
 *             $ref: '#/components/schemas/OperationEntryDTO'
 *         author:
 *           type: string
 *           description: Author of the operation plan
 *           example: "operator@gmail.com"
 *         algorithm:
 *           type: string
 *           description: Algorithm used to generate the plan
 *           example: "GENETIC_ALGORITHM"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-01-01T10:30:00Z"
 */
export interface OperationPlanDTO {
  id: string;
  vvn: string;
  targetDay: Date;
  arrivalTime: Date;
  departureTime: Date;
  operations: OperationEntryDTO[];
  author: string;
  algorithm: string;
  createdAt: Date;
}
