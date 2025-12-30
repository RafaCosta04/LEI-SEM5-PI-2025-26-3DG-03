import { Result } from "../../core/logic/Result";
import { ComplementaryTaskDTO, CreateComplementaryTaskDTO, UpdateComplementaryTaskDTO } from "../../dto/ComplementaryTaskDTO";
import { ComplementaryTaskStatus } from "../../domain/ComplementaryTaskEnums";

export default interface IComplementaryTaskService {
    createComplementaryTask(dto: CreateComplementaryTaskDTO): Promise<Result<ComplementaryTaskDTO>>;
    updateComplementaryTask(id: string, dto: UpdateComplementaryTaskDTO): Promise<Result<ComplementaryTaskDTO>>;
    getComplementaryTaskById(id: string): Promise<Result<ComplementaryTaskDTO>>;
    getAllComplementaryTasks(): Promise<Result<ComplementaryTaskDTO[]>>;
    getComplementaryTasksByVesselVisit(vveCode: string): Promise<Result<ComplementaryTaskDTO[]>>;
    getComplementaryTasksByStatus(status: ComplementaryTaskStatus): Promise<Result<ComplementaryTaskDTO[]>>;
    getComplementaryTasksByDateRange(startDate: Date, endDate: Date): Promise<Result<ComplementaryTaskDTO[]>>;
    getOngoingTasksThatSuspendOperations(): Promise<Result<ComplementaryTaskDTO[]>>;
    deleteComplementaryTask(id: string): Promise<Result<void>>;
}
