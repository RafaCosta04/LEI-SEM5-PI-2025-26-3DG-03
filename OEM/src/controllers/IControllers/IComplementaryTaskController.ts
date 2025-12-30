import { Request, Response, NextFunction } from "express";

export default interface IComplementaryTaskController {
    createComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComplementaryTaskById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllComplementaryTasks(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComplementaryTasksByVesselVisit(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComplementaryTasksByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComplementaryTasksByDateRange(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOngoingTasksThatSuspendOperations(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteComplementaryTask(req: Request, res: Response, next: NextFunction): Promise<void>;
}
