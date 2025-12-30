import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { Container } from 'typedi';
import IComplementaryTaskController from '../../controllers/IControllers/IComplementaryTaskController';
import config from "../../../config";

const route = Router();

export default (app: Router) => {
    app.use('/complementary-tasks', route);

    const ctrl = Container.get(config.controllers.complementaryTask.name) as IComplementaryTaskController;

    /**
     * @swagger
     * /complementary-tasks:
     *   post:
     *     tags: [ComplementaryTasks]
     *     summary: Create a new Complementary Task
     */
    route.post(
        '',
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                responsibleTeam: Joi.string().required().max(200),
                startTime: Joi.date().required(),
                endTime: Joi.date().optional(),
                vesselVisitExecutionCode: Joi.string().required(),
                suspendsOperations: Joi.boolean().required(),
                status: Joi.string().valid('Ongoing', 'Completed', 'Cancelled').optional(),
                description: Joi.string().optional().max(1000)
            })
        }),
        (req, res, next) => ctrl.createComplementaryTask(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/vessel-visit/{code}:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get complementary tasks by vessel visit execution code
     */
    route.get(
        '/vessel-visit/:code',
        celebrate({
            params: Joi.object({
                code: Joi.string().required()
            })
        }),
        (req, res, next) => ctrl.getComplementaryTasksByVesselVisit(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/status/{status}:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get complementary tasks by status
     */
    route.get(
        '/status/:status',
        celebrate({
            params: Joi.object({
                status: Joi.string().valid('Ongoing', 'Completed', 'Cancelled').required()
            })
        }),
        (req, res, next) => ctrl.getComplementaryTasksByStatus(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/date-range:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get complementary tasks by date range
     */
    route.get(
        '/date-range',
        celebrate({
            query: Joi.object({
                startDate: Joi.date().required(),
                endDate: Joi.date().required()
            })
        }),
        (req, res, next) => ctrl.getComplementaryTasksByDateRange(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/impacting-operations:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get ongoing tasks that suspend operations
     */
    route.get(
        '/impacting-operations',
        (req, res, next) => ctrl.getOngoingTasksThatSuspendOperations(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get all complementary tasks
     */
    route.get(
        '',
        (req, res, next) => ctrl.getAllComplementaryTasks(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/{id}:
     *   get:
     *     tags: [ComplementaryTasks]
     *     summary: Get a complementary task by ID
     */
    route.get(
        '/:id',
        celebrate({
            params: Joi.object({
                id: Joi.string().required()
            })
        }),
        (req, res, next) => ctrl.getComplementaryTaskById(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/{id}:
     *   put:
     *     tags: [ComplementaryTasks]
     *     summary: Update a complementary task
     */
    route.put(
        '/:id',
        celebrate({
            params: Joi.object({
                id: Joi.string().required()
            }),
            body: Joi.object({
                category: Joi.string().optional(),
                responsibleTeam: Joi.string().optional().max(200),
                endTime: Joi.date().optional(),
                status: Joi.string().valid('Ongoing', 'Completed', 'Cancelled').optional(),
                suspendsOperations: Joi.boolean().optional(),
                description: Joi.string().optional().max(1000)
            })
        }),
        (req, res, next) => ctrl.updateComplementaryTask(req, res, next)
    );

    /**
     * @swagger
     * /complementary-tasks/{id}:
     *   delete:
     *     tags: [ComplementaryTasks]
     *     summary: Delete a complementary task
     */
    route.delete(
        '/:id',
        celebrate({
            params: Joi.object({
                id: Joi.string().required()
            })
        }),
        (req, res, next) => ctrl.deleteComplementaryTask(req, res, next)
    );
};
