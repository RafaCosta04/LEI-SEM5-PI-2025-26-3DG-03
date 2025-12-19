import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OemService } from './oem.service';
import { IncidentModel } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {

  constructor(private oemService: OemService) {}

  private normalizeIncident(dto: any): IncidentModel {
    if (!dto) return dto;
    const incidentTypeCode = dto.incidentTypeByCode ?? dto.incidentTypeCode;
    return { ...dto, incidentTypeCode } as IncidentModel;
  }

  private normalizeIncidentArray(dtos: any[]): IncidentModel[] {
    return (dtos || []).map(d => this.normalizeIncident(d));
  }

  getAllIncidents(): Observable<IncidentModel[]> {
    return this.oemService.get<IncidentModel[]>('/incidents').pipe(
      map(items => this.normalizeIncidentArray(items as any))
    );
  }

  getIncidentById(id: string): Observable<IncidentModel> {
    return this.oemService.get<IncidentModel>(`/incidents/id/${id}`).pipe(
      map(item => this.normalizeIncident(item as any))
    );
  }

  getIncidentsByVessel(vesselIMO: string): Observable<IncidentModel[]> {
    return this.oemService.get<IncidentModel[]>(`/incidents/vessel/${vesselIMO}`).pipe(
      map(items => this.normalizeIncidentArray(items as any))
    );
  }

  getIncidentsByDateRange(from: string, to: string): Observable<IncidentModel[]> {
    return this.oemService.get<IncidentModel[]>(`/incidents/date-range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).pipe(
      map(items => this.normalizeIncidentArray(items as any))
    );
  }

  getIncidentsBySeverity(severity: string): Observable<IncidentModel[]> {
    return this.oemService.get<IncidentModel[]>(`/incidents/severity/${severity}`).pipe(
      map(items => this.normalizeIncidentArray(items as any))
    );
  }

  getIncidentsByStatus(status: string): Observable<IncidentModel[]> {
    return this.oemService.get<IncidentModel[]>(`/incidents/status/${status}`).pipe(
      map(items => this.normalizeIncidentArray(items as any))
    );
  }

  createIncident(incident: IncidentModel): Observable<IncidentModel> {
    // Normalize dates to ISO strings to satisfy backend Joi/date parsing
    const start = incident.startDate
      ? new Date(incident.startDate).toISOString()
      : new Date().toISOString();
    const end = incident.endDate
      ? new Date(incident.endDate).toISOString()
      : null;

    const payload = {
      incidentTypeByCode: incident.incidentTypeCode,
      startDate: start,
      endDate: end,
      status: incident.status,
      description: incident.description,
      // Send empty array when no VVEs to avoid null-related validation edge cases
      vesselVisitExecutionsCodes: incident.vesselVisitExecutionsCodes ?? []
    };
    return this.oemService.post<IncidentModel>('/incidents', payload).pipe(
      map(item => this.normalizeIncident(item as any))
    );
  }

  updateIncident(id: string, incident: IncidentModel): Observable<IncidentModel> {
    return this.oemService.put<IncidentModel>(`/incidents/update/${id}`, incident).pipe(
      map(item => this.normalizeIncident(item as any))
    );
  }

  /**
   * Get ongoing incidents that overlap with the time range [startDate, endDate]
   */
  getOngoingIncidents(startDate: Date, endDate?: Date): Observable<IncidentModel[]> {
    const end = endDate || new Date();
    
    return this.getAllIncidents().pipe(
      map(incidents => {
        console.log('All incidents from API:', incidents);
        
        return incidents.filter(incident => {
          const incidentStart = new Date(incident.startDate || 0);
          const incidentEnd = incident.endDate ? new Date(incident.endDate) : new Date();
          
          // Check if incident overlaps with the given time range
          // incident overlaps if: incidentStart <= endDate AND incidentEnd >= startDate
          const overlaps = incidentStart.getTime() <= end.getTime() && 
                           incidentEnd.getTime() >= startDate.getTime();
          
          console.log(`Incident "${incident.description}" - Start: ${incidentStart}, End: ${incidentEnd}, Range: [${startDate}, ${end}], Overlaps: ${overlaps}`);
          
          return overlaps;
        });
      })
    );
  }
}
