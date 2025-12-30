import { ComplementaryTaskStatus } from "./ComplementaryTaskEnums";

export class ComplementaryTask {
    constructor(
        public id: string,
        public category: string,
        public responsibleTeam: string,
        public startTime: Date,
        public status: ComplementaryTaskStatus,
        public vesselVisitExecutionCode: string,
        public suspendsOperations: boolean,
        public endTime?: Date,
        public description?: string
    ) {
        this.validateCategory(category);
        this.validateResponsibleTeam(responsibleTeam);
        this.validateStartTime(startTime);
        this.validateEndTime(startTime, endTime);
        this.validateStatus(status);
        this.validateVesselVisitExecutionCode(vesselVisitExecutionCode);
    }

    private validateCategory(category: string) {
        if (!category || category.trim().length === 0) {
            throw new Error("Category cannot be null or empty.");
        }
    }

    private validateResponsibleTeam(team: string) {
        if (!team || team.trim().length === 0) {
            throw new Error("Responsible team cannot be null or empty.");
        }
        if (team.trim().length > 200) {
            throw new Error("Responsible team cannot exceed 200 characters.");
        }
    }

    private validateStartTime(startTime: Date) {
        if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
            throw new Error("Start time must be a valid date.");
        }
    }

    private validateEndTime(startTime: Date, endTime?: Date) {
        if (endTime) {
            if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
                throw new Error("End time must be a valid date.");
            }
            if (endTime.getTime() < startTime.getTime()) {
                throw new Error("End time cannot be before start time.");
            }
        }
    }

    private validateStatus(status: ComplementaryTaskStatus) {
        if (!Object.values(ComplementaryTaskStatus).includes(status)) {
            throw new Error("Invalid complementary task status.");
        }
    }

    private validateVesselVisitExecutionCode(code: string) {
        if (!code || code.trim().length === 0) {
            throw new Error("Vessel visit execution code cannot be null or empty.");
        }
    }

    updateStatus(newStatus: ComplementaryTaskStatus, endTime?: Date) {
        this.validateStatus(newStatus);
        
        if (newStatus === ComplementaryTaskStatus.Completed) {
            if (!endTime) {
                throw new Error("End time is required when completing a task.");
            }
            this.validateEndTime(this.startTime, endTime);
            this.endTime = endTime;
        }
        
        this.status = newStatus;
    }

    updateEndTime(endTime: Date) {
        this.validateEndTime(this.startTime, endTime);
        this.endTime = endTime;
    }

    updateDescription(description: string) {
        if (description && description.trim().length > 1000) {
            throw new Error("Description cannot exceed 1000 characters.");
        }
        this.description = description;
    }

    isImpactingOperations(): boolean {
        return this.suspendsOperations && this.status === ComplementaryTaskStatus.Ongoing;
    }

    getDuration(): number | null {
        if (!this.endTime) {
            return null;
        }
        return this.endTime.getTime() - this.startTime.getTime();
    }
}
