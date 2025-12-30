import { Service, Inject } from 'typedi';
import IComplementaryTaskRepo from '../services/IRepos/IComplementaryTaskRepo';
import { ComplementaryTask } from '../domain/ComplementaryTask';
import { Document, Model } from 'mongoose';
import { IComplementaryTaskPersistence } from '../dataschema/IComplementaryTaskPersistence';
import { ComplementaryTaskMap } from "../mappers/ComplementaryTaskMap";
import { ComplementaryTaskStatus } from '../domain/ComplementaryTaskEnums';

@Service()
export default class ComplementaryTaskRepo implements IComplementaryTaskRepo {

    constructor(
        @Inject('complementaryTaskSchema') private complementaryTaskSchema: Model<IComplementaryTaskPersistence & Document>,  
    ){}

    async exists(task: ComplementaryTask): Promise<boolean> {
        const record = await this.complementaryTaskSchema.findById(task.id);
        return !!record;
    }

    async save(task: ComplementaryTask): Promise<ComplementaryTask> {
        const raw = ComplementaryTaskMap.toPersistence(task);
        const created = await this.complementaryTaskSchema.create(raw);
        return ComplementaryTaskMap.toDomain(created);
    }

    async findById(id: string): Promise<ComplementaryTask | null> {
        const record = await this.complementaryTaskSchema.findById(id);
        return record ? ComplementaryTaskMap.toDomain(record) : null;
    }

    async findAll(): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema.find().sort({ startTime: -1 });
        return records.map(record => ComplementaryTaskMap.toDomain(record));
    }

    async findByVesselVisitExecutionCode(code: string): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema
            .find({ vesselVisitExecutionCode: code })
            .sort({ startTime: -1 });
        return records.map(record => ComplementaryTaskMap.toDomain(record));
    }

    async findByStatus(status: ComplementaryTaskStatus): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema
            .find({ status })
            .sort({ startTime: -1 });
        return records.map(record => ComplementaryTaskMap.toDomain(record));
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema
            .find({
                startTime: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .sort({ startTime: -1 });
        return records.map(record => ComplementaryTaskMap.toDomain(record));
    }

    async findOngoingThatSuspendOperations(): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema
            .find({
                status: ComplementaryTaskStatus.Ongoing,
                suspendsOperations: true
            })
            .sort({ startTime: -1 });
        return records.map(record => ComplementaryTaskMap.toDomain(record));
    }

    async update(task: ComplementaryTask): Promise<ComplementaryTask | null> {
        const raw = ComplementaryTaskMap.toPersistence(task);
        const updated = await this.complementaryTaskSchema.findByIdAndUpdate(
            task.id,
            raw,
            { new: true }
        );
        return updated ? ComplementaryTaskMap.toDomain(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.complementaryTaskSchema.findByIdAndDelete(id);
        return !!result;
    }
}
