import { Service, Inject } from 'typedi';
import IIncidentRepo from '../services/IRepos/IIncidentRepo';
import { Incident } from '../domain/Incident';
import { Document, Model } from 'mongoose';
import { IIncidentPersistence } from '../dataschema/IIncidentPersistence';
import { IncidentMap } from "../mappers/IncidentMap";
import { IncidentStatus } from '../domain/IncidentStatus';

@Service()
export default class IncidentRepo implements IIncidentRepo {

    constructor(
        @Inject('incidentSchema') private incidentSchema: Model<IIncidentPersistence & Document>,  
    ){}

    async exists(incident: Incident): Promise<boolean> {
        const record = await this.incidentSchema.findOne({ _id: incident.id });
        return !!record;
    }

    async save(incident: Incident): Promise<Incident> {
        // Avoid casting empty string to ObjectId; treat as new document
        let existing: (IIncidentPersistence & Document) | null = null;
        if (incident.id && incident.id !== "") {
            existing = await this.incidentSchema.findById(incident.id);
        }

        const raw = IncidentMap.toPersistence(incident);

        if (!existing) {
            const created = await this.incidentSchema.create(raw);
            return IncidentMap.toDomain(created);
        } else {
            // If already exists, return the domain representation of existing
            return IncidentMap.toDomain(existing);
        }
    }

    async findAll(): Promise<Incident[]> {
        const records = await this.incidentSchema.find();
        return records.map(record => IncidentMap.toDomain(record));
    }

    async findById(id: string): Promise<Incident | null> {
        const record = await this.incidentSchema.findById(id);
        return record ? IncidentMap.toDomain(record) : null;
    }

    async findByIDs(ids: string[]): Promise<Incident[]> {
        const records = await this.incidentSchema.find({ _id: { $in: ids } });
        return records.map(record => IncidentMap.toDomain(record));
    }

    async findByVesselIMO(vesselIMO: string): Promise<Incident[]> {
        const records = await this.incidentSchema.find()
            .populate('vesselVisitExecutionsCodes')
            .lean()
            .then((incidents: any[]) => 
                incidents.filter(inc => 
                    inc.vesselVisitExecutionsCodes?.some((vve: any) => vve.vesselIMO === vesselIMO)
                )
            );
        return records.map(record => IncidentMap.toDomain(record));
    }

    async findByDateRange(startDate: Date, endDate: Date | null): Promise<Incident[]> {
        const query: any = {
            startDate: { $gte: startDate }
        };
        
        if (endDate) {
            query.startDate.$lte = endDate;
        }

        const records = await this.incidentSchema.find(query);
        return records.map(record => IncidentMap.toDomain(record));
    }

    async findBySeverity(severity: string): Promise<Incident[]> {
        const records = await this.incidentSchema.find()
            .populate('incidentTypeCode')
            .lean()
            .then((incidents: any[]) => 
                incidents.filter(inc => inc.incidentTypeCode?.severity === severity)
            );
        return records.map(record => IncidentMap.toDomain(record));
    }

    async findByStatus(status: IncidentStatus): Promise<Incident[]> {
        const records = await this.incidentSchema.find({ status });
        return records.map(record => IncidentMap.toDomain(record));
    }

    async update(incident: Incident): Promise<boolean> {
        const raw = IncidentMap.toPersistence(incident);
        const result = await this.incidentSchema.updateOne({ _id: incident.id }, raw);
        return result.modifiedCount > 0;
    }
}
    