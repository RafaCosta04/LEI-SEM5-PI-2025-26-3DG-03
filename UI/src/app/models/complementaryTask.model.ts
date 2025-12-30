export enum ComplementaryTaskStatus {
  Ongoing = 'Ongoing',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface ComplementaryTaskModel {
  id?: string;
  category: string;
  responsibleTeam: string;
  startTime: string | Date;
  endTime?: string | Date;
  status: ComplementaryTaskStatus;
  vesselVisitExecutionCode: string;
  suspendsOperations: boolean;
  description?: string;
}
