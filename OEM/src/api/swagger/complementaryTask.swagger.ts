/**
 * @swagger
 * tags:
 *   name: ComplementaryTasks
 *   description: Complementary tasks during vessel visits
 */

/**
 * @swagger
 * /api/complementaryTasks:
 *   get:
 *     summary: Get all complementary tasks or filter by criteria
 *     tags: [ComplementaryTasks]
 *     parameters:
 *       - in: query
 *         name: vveCode
 *         schema:
 *           type: string
 *         description: Filter by vessel visit execution code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ongoing, Completed, Cancelled]
 *         description: Filter by task status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for date range filter
 *       - in: query
 *         name: impactingOnly
 *         schema:
 *           type: boolean
 *         description: If true, return only ongoing tasks that suspend operations
 *     responses:
 *       200:
 *         description: List of complementary tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComplementaryTaskDTO'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new complementary task
 *     tags: [ComplementaryTasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - responsibleTeam
 *               - startTime
 *               - vesselVisitExecutionCode
 *               - suspendsOperations
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [Inspection, Cleaning, Maintenance, SafetyProcedure, Refueling, CertificationCheck, Other]
 *               responsibleTeam:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               vesselVisitExecutionCode:
 *                 type: string
 *               suspendsOperations:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Complementary task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComplementaryTaskDTO'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/complementaryTasks/{id}:
 *   get:
 *     summary: Get a complementary task by ID
 *     tags: [ComplementaryTasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The complementary task ID
 *     responses:
 *       200:
 *         description: Complementary task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComplementaryTaskDTO'
 *       404:
 *         description: Complementary task not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a complementary task
 *     tags: [ComplementaryTasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The complementary task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [Inspection, Cleaning, Maintenance, SafetyProcedure, Refueling, CertificationCheck, Other]
 *               responsibleTeam:
 *                 type: string
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [Ongoing, Completed, Cancelled]
 *               suspendsOperations:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complementary task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComplementaryTaskDTO'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Complementary task not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a complementary task
 *     tags: [ComplementaryTasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The complementary task ID
 *     responses:
 *       204:
 *         description: Complementary task deleted successfully
 *       404:
 *         description: Complementary task not found
 *       500:
 *         description: Internal server error
 */

export {};
