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
 *         vvn:
 *           type: string
 *         targetDay:
 *           type: string
 *           format: date
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *         departureTime:
 *           type: string
 *           format: date-time
 *         operations:
 *           type: array
 *         author:
 *           type: string
 *         algorithm:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */