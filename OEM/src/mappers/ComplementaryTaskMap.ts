import { ComplementaryTask } from "../domain/ComplementaryTask";
import { IComplementaryTaskPersistence } from "../dataschema/IComplementaryTaskPersistence";
import { ComplementaryTaskDTO } from "../dto/ComplementaryTaskDTO";

export class ComplementaryTaskMap {

    public static toDomain(raw: IComplementaryTaskPersistence | any): ComplementaryTask {
        return new ComplementaryTask(
            raw._id ? raw._id.toString() : "",
            raw.category,
            raw.responsibleTeam,
            raw.startTime instanceof Date ? raw.startTime : new Date(raw.startTime),
            raw.status,
            raw.vesselVisitExecutionCode,
            raw.suspendsOperations,
            raw.endTime ? (raw.endTime instanceof Date ? raw.endTime : new Date(raw.endTime)) : undefined,
            raw.description
        );
    }

    public static toPersistence(task: ComplementaryTask): IComplementaryTaskPersistence {
        const persistence: any = {
            category: task.category,
            responsibleTeam: task.responsibleTeam,
            startTime: task.startTime,
            status: task.status,
            vesselVisitExecutionCode: task.vesselVisitExecutionCode,
            suspendsOperations: task.suspendsOperations
        };

        if (task.id && task.id !== "") {
            persistence._id = task.id;
        }

        if (task.endTime) {
            persistence.endTime = task.endTime;
        }

        if (task.description) {
            persistence.description = task.description;
        }

        return persistence;
    }

    public static toDTO(task: ComplementaryTask): ComplementaryTaskDTO {
        return {
            id: task.id,
            category: task.category,
            responsibleTeam: task.responsibleTeam,
            startTime: task.startTime,
            endTime: task.endTime,
            status: task.status,
            vesselVisitExecutionCode: task.vesselVisitExecutionCode,
            suspendsOperations: task.suspendsOperations,
            description: task.description
        };
    }
}
