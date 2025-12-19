export interface IncidentModel {
  id?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
  duration?: number | null;
  severity?: string;
  status?: string;
  vesselVisitExecutionsCodes?: string[] | null;
  incidentTypeCode?: string;
  systemUserID?: string;
  lastUpdated?: string | Date;
}
