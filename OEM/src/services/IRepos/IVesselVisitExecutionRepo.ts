import { Repo } from "../../core/infra/Repo";
import { VesselVisitExecution } from '../../domain/VesselVisitExecution';
import { VesselVisitExecutionStatus } from "../../domain/VesselVisitExecutionStatus";

export default interface IVesselVisitExecutionRepo extends Repo<VesselVisitExecution> {
    findAll(): Promise<VesselVisitExecution[]>;
    findById(id: string): Promise<VesselVisitExecution | null>;
    findByCode(code: string): Promise<VesselVisitExecution | null>;
    findByCodes(codes: string[]): Promise<VesselVisitExecution[]>;
    findByStatus(status: VesselVisitExecutionStatus): Promise<VesselVisitExecution[]>;
    findByVesselIMO(vesselIMO: string): Promise<VesselVisitExecution | null>;
    findByVesselIMOs(vesselIMO: string): Promise<VesselVisitExecution[]>;
    findByVvnCode(vvnCode: string): Promise<VesselVisitExecution | null>;
    findByFilters(filters: { from?: Date; to?: Date; vesselIMO?: string; status?: VesselVisitExecutionStatus }): Promise<VesselVisitExecution[]>;
    update(vve: VesselVisitExecution): Promise<boolean>;
}