export interface IncidentTypeModel {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  classification?: string;
  parentIncidentTypeCode?: string;
}
