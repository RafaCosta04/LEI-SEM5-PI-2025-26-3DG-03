import { ComplementaryTaskStatus, ComplementaryTaskCategory } from "../domain/ComplementaryTaskEnums";

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
