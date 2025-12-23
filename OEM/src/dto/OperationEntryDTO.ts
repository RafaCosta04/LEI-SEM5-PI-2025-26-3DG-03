/**
 * @swagger
 * components:
 *   schemas:
 *     OperationEntryDTO:
 *       type: object
 *       required:
 *         - id
 *         - operationType
 *         - container
 *         - operationStart
 *         - operationEnd
 *         - craneUsed
 *       properties:
 *         id:
 *           type: string
 *           description: Operation entry identifier
 *           example: "OP001"
 *         operationType:
 *           type: string
 *           description: Type of operation
 *           example: "LOAD"
 *         container:
 *           type: string
 *           description: Container identifier
 *           example: "CONT1234567"
 *         operationStart:
 *           type: string
 *           format: date-time
 *           description: Start time of the operation
 *           example: "2025-01-10T08:00:00Z"
 *         operationEnd:
 *           type: string
 *           format: date-time
 *           description: End time of the operation
 *           example: "2025-01-10T09:00:00Z"
 *         craneUsed:
 *           type: string
 *           description: Crane used in the operation
 *           example: "CRANE_01"
 */
export interface OperationEntryDTO {
  id: string;
  operationType: string;
  container: string;
  operationStart: Date;
  operationEnd: Date;
  craneUsed: string;
}
