import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OemService } from './oem.service';
import { IncidentTypeModel } from '../models/incidentType.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentTypeService {

  constructor(private oemService: OemService) {}

  createIncidentType(incidentType: IncidentTypeModel): Observable<IncidentTypeModel> {
    return this.oemService.post<IncidentTypeModel>('/incident-types', incidentType);
  }

  updateIncidentType(code: string, incidentType: IncidentTypeModel): Observable<IncidentTypeModel> {
    return this.oemService.put<IncidentTypeModel>(`/incident-types/update/${code}`, incidentType);
  }

  getAllIncidentTypes(): Observable<IncidentTypeModel[]> {
    return this.oemService.get<IncidentTypeModel[]>('/incident-types');
  }

  getIncidentTypeById(id: string): Observable<IncidentTypeModel> {
    return this.oemService.get<IncidentTypeModel>(`/incident-types/id/${id}`);
  }

  getIncidentTypeByCode(code: string): Observable<IncidentTypeModel> {
    return this.oemService.get<IncidentTypeModel>(`/incident-types/code/${code}`);
  }

  getIncidentTypeByName(name: string): Observable<IncidentTypeModel> {
    return this.oemService.get<IncidentTypeModel>(`/incident-types/name/${name}`);
  }

  getIncidentTypesByParent(parentCode: string): Observable<IncidentTypeModel[]> {
    return this.oemService.get<IncidentTypeModel[]>(`/incident-types/parent/${parentCode}`);
  }

  getIncidentTypesByClassification(classification: string): Observable<IncidentTypeModel[]> {
    return this.oemService.get<IncidentTypeModel[]>(`/incident-types/classification/${classification}`);
  }

  getIncidentTypesWithParent(value: boolean): Observable<IncidentTypeModel[]> {
    return this.oemService.get<IncidentTypeModel[]>(`/incident-types/hasParent/${value}`);
  }
}
