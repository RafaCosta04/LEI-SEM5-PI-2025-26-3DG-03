import { ComplementaryTask } from "../../domain/ComplementaryTask";
import { ComplementaryTaskStatus } from "../../domain/ComplementaryTaskEnums";

export default interface IComplementaryTaskRepo {
    exists(task: ComplementaryTask): Promise<boolean>;
    save(task: ComplementaryTask): Promise<ComplementaryTask>;
    findById(id: string): Promise<ComplementaryTask | null>;
    findAll(): Promise<ComplementaryTask[]>;
    findByVesselVisitExecutionCode(code: string): Promise<ComplementaryTask[]>;
    findByStatus(status: ComplementaryTaskStatus): Promise<ComplementaryTask[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<ComplementaryTask[]>;
    findOngoingThatSuspendOperations(): Promise<ComplementaryTask[]>;
    update(task: ComplementaryTask): Promise<ComplementaryTask | null>;
    delete(id: string): Promise<boolean>;
}
