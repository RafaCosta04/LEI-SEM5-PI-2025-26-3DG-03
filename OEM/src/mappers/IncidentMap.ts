import { Incident } from "../domain/Incident";
import { IIncidentPersistence } from "../dataschema/IIncidentPersistence";
import { IncidentDTO } from "../dto/IncidentDTO";

export class IncidentMap {

    public static toDomain(raw: IIncidentPersistence | any): Incident {
        // Accept service-provided object `incidentType` or fall back to code
        const incidentType = raw.incidentType ?? raw.incidentTypeCode;

        // Normalize dates to Date instances (service may pass Date, persistence may pass strings)
        const startDate: Date = raw.startDate instanceof Date ? raw.startDate : new Date(raw.startDate);
        const endDate: Date | null = raw.endDate
            ? (raw.endDate instanceof Date ? raw.endDate : new Date(raw.endDate))
            : null;

        // Accept either full objects (`vesselVisitExecutions`) or code array (`vesselVisitExecutionsCodes`)
        const vesselVisitExecutions = Array.isArray(raw.vesselVisitExecutions)
            ? raw.vesselVisitExecutions
            : (Array.isArray(raw.vesselVisitExecutionsCodes)
                ? raw.vesselVisitExecutionsCodes.map((vve: any) => (typeof vve === 'object' && vve !== null ? vve : vve))
                : null);

        return new Incident(
            raw._id ? raw._id.toString() : "",
            incidentType,
            startDate,
            endDate,
            raw.status,
            raw.description,
            raw.systemUserID,
            raw.lastUpdated,
            raw.duration ?? null,
            vesselVisitExecutions
        );
    }

    public static toPersistence(incident: Incident): IIncidentPersistence {
        const typeCode = typeof (incident as any).incidentType === 'string'
            ? (incident as any).incidentType
            : (incident as any).incidentType?.code;

        const persistence: any = {
            incidentTypeCode: typeCode,
            startDate: incident.startDate,
            endDate: incident.endDate,
            status: incident.status,
            description: incident.description,
            systemUserID: incident.systemUserID,
            lastUpdated: incident.lastUpdated,
            duration: incident.duration,
            vesselVisitExecutionsCodes: incident.vesselVisitExecutions ? incident.vesselVisitExecutions.map(vve => vve.code) : null,
        };

        if (incident.id && incident.id !== "") {
            persistence._id = incident.id;
        }

        return persistence;
    }

    public static toDTO(incident: Incident): IncidentDTO {
        // Compute type code whether incidentType is an object or already a string code
        const typeCode = typeof (incident as any).incidentType === 'string'
            ? (incident as any).incidentType
            : (incident as any).incidentType?.code;

        // If vesselVisitExecutions are objects, extract codes; otherwise use them as-is
        let vveCodes: string[] | null = null;
        if (incident.vesselVisitExecutions) {
            if (incident.vesselVisitExecutions.length > 0 && typeof incident.vesselVisitExecutions[0] === 'object' && incident.vesselVisitExecutions[0] !== null) {
                vveCodes = incident.vesselVisitExecutions.map((vve: any) => vve.code);
            } else {
                vveCodes = incident.vesselVisitExecutions as any;
            }
        }
        
        return {
            id: incident.id,
            incidentTypeByCode: typeCode,
            startDate: incident.startDate,
            endDate: incident.endDate,
            status: incident.status,
            description: incident.description,
            systemUserID: incident.systemUserID,
            lastUpdated: incident.lastUpdated,
            duration: incident.duration,
            vesselVisitExecutionsCodes: vveCodes,
        };
    }
}