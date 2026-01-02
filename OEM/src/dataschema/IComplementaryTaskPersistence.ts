import { ComplementaryTaskStatus } from "../domain/ComplementaryTaskEnums";
import { ComplementaryTaskCategory } from "../domain/ComplementaryTaskCategory";
export interface IComplementaryTaskPersistence {
    _id: string;
    category: ComplementaryTaskCategory;
    responsibleTeam: string;
    startTime: Date;
    endTime?: Date;
    status: ComplementaryTaskStatus;
    vesselVisitExecutionCode: string;
    suspendsOperations: boolean;
    description?: string;
}
