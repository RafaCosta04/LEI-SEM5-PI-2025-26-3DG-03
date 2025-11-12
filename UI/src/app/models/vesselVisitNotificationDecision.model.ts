// Enums from backend
export enum DecisionStatus {
  Approved = 'Approved',
  Rejected = 'Rejected'
}

// Model interfaces
export interface VesselVisitNotificationDecisionModel {
  id?: number;
  status: DecisionStatus;
  responseMessage: string;
  decisionDate?: Date;
  vesselVisitNotificationCode: string;
  officerId: number;
}
