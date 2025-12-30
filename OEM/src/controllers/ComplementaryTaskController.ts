import { Request, Response, NextFunction } from "express";
import { Inject, Service } from 'typedi';
import IComplementaryTaskController from './IControllers/IComplementaryTaskController';
import IComplementaryTaskService from '../services/IServices/IComplementaryTaskService';
import { CreateComplementaryTaskDTO, UpdateComplementaryTaskDTO } from '../dto/ComplementaryTaskDTO';
import { ComplementaryTaskStatus } from '../domain/ComplementaryTaskEnums';

@Service()
export default class ComplementaryTaskController implements IComplementaryTaskController {

    constructor(
        @Inject('complementaryTaskService') private complementaryTaskService: IComplementaryTaskService,
        @Inject('logger') private logger: any
    ) {}

    public async createComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Creating complementary task');
            const dto: CreateComplementaryTaskDTO = req.body;

            // Validate required fields
            if (!dto.category || !dto.responsibleTeam || !dto.startTime || 
                !dto.vesselVisitExecutionCode || dto.suspendsOperations === undefined) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const result = await this.complementaryTaskService.createComplementaryTask(dto);
            
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async updateComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating complementary task');
            const id = req.params.id;
            const dto: UpdateComplementaryTaskDTO = req.body;

            const result = await this.complementaryTaskService.updateComplementaryTask(id, dto);
            
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                const errorMsg = String(result.error || 'Unknown error');
                if (errorMsg.includes('not found')) {
                    res.status(404).json({ error: errorMsg });
                } else {
                    res.status(400).json({ error: errorMsg });
                }
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getComplementaryTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task by ID');
            const id = req.params.id;

            const result = await this.complementaryTaskService.getComplementaryTaskById(id);
            
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getAllComplementaryTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all complementary tasks');
            const result = await this.complementaryTaskService.getAllComplementaryTasks();
            
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getComplementaryTasksByFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary tasks with filters');
            const { vveCode, status, startDate, endDate, impactingOnly } = req.query as any;

            // If requesting only tasks impacting operations
            if (impactingOnly === 'true') {
                const result = await this.complementaryTaskService.getOngoingTasksThatSuspendOperations();
                if (result.isSuccess) {
                    res.status(200).json(result.getValue());
                } else {
                    res.status(500).json({ error: result.error });
                }
                return;
            }

            // Filter by vessel visit execution code
            if (vveCode) {
                const result = await this.complementaryTaskService.getComplementaryTasksByVesselVisit(vveCode);
                if (result.isSuccess) {
                    res.status(200).json(result.getValue());
                } else {
                    res.status(500).json({ error: result.error });
                }
                return;
            }

            // Filter by status
            if (status) {
                const statusEnum = status as ComplementaryTaskStatus;
                if (!Object.values(ComplementaryTaskStatus).includes(statusEnum)) {
                    res.status(400).json({ error: 'Invalid status value' });
                    return;
                }
                const result = await this.complementaryTaskService.getComplementaryTasksByStatus(statusEnum);
                if (result.isSuccess) {
                    res.status(200).json(result.getValue());
                } else {
                    res.status(500).json({ error: result.error });
                }
                return;
            }

            // Filter by date range
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    res.status(400).json({ error: 'Invalid date format' });
                    return;
                }

                const result = await this.complementaryTaskService.getComplementaryTasksByDateRange(start, end);
                if (result.isSuccess) {
                    res.status(200).json(result.getValue());
                } else {
                    res.status(500).json({ error: result.error });
                }
                return;
            }

            // No filters, return all
            const result = await this.complementaryTaskService.getAllComplementaryTasks();
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }

        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getComplementaryTasksByVesselVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary tasks by vessel visit');
            const code = req.params.code;

            const result = await this.complementaryTaskService.getComplementaryTasksByVesselVisit(code);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getComplementaryTasksByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary tasks by status');
            const statusEnum = req.params.status as ComplementaryTaskStatus;

            if (!Object.values(ComplementaryTaskStatus).includes(statusEnum)) {
                res.status(400).json({ error: 'Invalid status value' });
                return;
            }

            const result = await this.complementaryTaskService.getComplementaryTasksByStatus(statusEnum);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getComplementaryTasksByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary tasks by date range');
            const { startDate, endDate } = req.query as any;

            if (!startDate || !endDate) {
                res.status(400).json({ error: 'startDate and endDate are required' });
                return;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({ error: 'Invalid date format' });
                return;
            }

            const result = await this.complementaryTaskService.getComplementaryTasksByDateRange(start, end);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getOngoingTasksThatSuspendOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting ongoing tasks that suspend operations');
            const result = await this.complementaryTaskService.getOngoingTasksThatSuspendOperations();
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async deleteComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Deleting complementary task');
            const id = req.params.id;

            const result = await this.complementaryTaskService.deleteComplementaryTask(id);
            
            if (result.isSuccess) {
                res.status(200).send();
            } else {
                const errorMsg = String(result.error || 'Unknown error');
                if (errorMsg.includes('not found')) {
                    res.status(404).json({ error: errorMsg });
                } else {
                    res.status(400).json({ error: errorMsg });
                }
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
