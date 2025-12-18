import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { VesselVisitExecutionModel } from '../models/vesselVisitExecution.model';
import { OemService } from '../services-oem/oem.service';

@Injectable({ providedIn: 'root' })
export class VesselVisitExecutionService {
  constructor(private oemService: OemService) {}

  // OEM endpoints under /vessel-visit-executions
  getAll(): Observable<VesselVisitExecutionModel[]> {
    return this.oemService.get<any[]>('/vessel-visit-executions').pipe(
      map((dtos) => (dtos || []).map(this.mapDtoToVVE)),
      catchError((err) => this.handleError('getAll', err))
    );
  }

  // No dedicated name endpoint; perform client-side filtering
  getByName(name: string): Observable<VesselVisitExecutionModel[]> {
    const term = (name || '').toLowerCase();
    return this.getAll().pipe(
      map(items => items.filter(i =>
        (i.name || '').toLowerCase().includes(term) ||
        (i.code || '').toLowerCase().includes(term) ||
        (i.description || '').toLowerCase().includes(term)
      )),
      catchError((err) => this.handleError('getByName', err))
    );
  }

  create(model: VesselVisitExecutionModel): Observable<any> {
    // Align payload with OEM route expectations (vesselVisitNotificationCode, arrivalDate)
    const payload: any = {
      vesselVisitNotificationCode: (model as any).vesselVisitNotificationCode ?? model.code,
      arrivalDate: (model as any).arrivalDate ?? model.description
    };
    return this.oemService.post<any>('/vessel-visit-executions', payload).pipe(
      catchError((err) => this.handleError('create', err))
    );
  }

  private mapDtoToVVE = (dto: any): VesselVisitExecutionModel => ({
    id: dto?.id ?? dto?._id ?? undefined,
    code: dto?.code ?? dto?.vesselVisitNotificationCode ?? '',
    name: dto?.vesselIMO ?? dto?.vessel?.imo ?? dto?.vesselVisitNotificationCode ?? '',
    description: dto?.status ?? dto?.visitStatus ?? '',
    status: dto?.status ?? dto?.visitStatus,
    arrivalDate: dto?.arrivalDate,
    lastUpdated: dto?.lastUpdated,
    systemUserID: dto?.systemUserID,
    vesselVisitNotificationCode: dto?.code ?? dto?.vesselVisitNotificationCode
  });

  private handleError(context: string, error: any) {
    const errorMessage = error?.error?.message || error?.message || `VVE service error in ${context}`;
    console.error('VesselVisitExecutionService error:', errorMessage);
    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}
