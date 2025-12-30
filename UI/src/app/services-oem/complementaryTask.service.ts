import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ComplementaryTaskModel, ComplementaryTaskStatus } from '../models/complementaryTask.model';
import { OemService } from './oem.service';

@Injectable({ providedIn: 'root' })
export class ComplementaryTaskService {
  constructor(private oemService: OemService) {}

  getAll(): Observable<ComplementaryTaskModel[]> {
    return this.oemService.get<ComplementaryTaskModel[]>('/complementary-tasks').pipe(
      catchError((err) => this.handleError('getAll', err))
    );
  }

  getById(id: string): Observable<ComplementaryTaskModel> {
    return this.oemService.get<ComplementaryTaskModel>(`/complementary-tasks/${id}`).pipe(
      catchError((err) => this.handleError('getById', err))
    );
  }

  getByVesselVisitExecution(vveCode: string): Observable<ComplementaryTaskModel[]> {
    return this.oemService.get<ComplementaryTaskModel[]>(`/complementary-tasks?vveCode=${encodeURIComponent(vveCode)}`).pipe(
      catchError((err) => this.handleError('getByVesselVisitExecution', err))
    );
  }

  getByStatus(status: ComplementaryTaskStatus): Observable<ComplementaryTaskModel[]> {
    return this.oemService.get<ComplementaryTaskModel[]>(`/complementary-tasks?status=${status}`).pipe(
      catchError((err) => this.handleError('getByStatus', err))
    );
  }

  getByDateRange(startDate: Date, endDate: Date): Observable<ComplementaryTaskModel[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.oemService.get<ComplementaryTaskModel[]>(
      `/complementary-tasks?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
    ).pipe(
      catchError((err) => this.handleError('getByDateRange', err))
    );
  }

  getImpactingOperations(): Observable<ComplementaryTaskModel[]> {
    return this.oemService.get<ComplementaryTaskModel[]>('/complementary-tasks?impactingOnly=true').pipe(
      catchError((err) => this.handleError('getImpactingOperations', err))
    );
  }

  create(task: Omit<ComplementaryTaskModel, 'id'>): Observable<ComplementaryTaskModel> {
    return this.oemService.post<ComplementaryTaskModel>('/complementary-tasks', task).pipe(
      catchError((err) => this.handleError('create', err))
    );
  }

  update(id: string, task: Partial<ComplementaryTaskModel>): Observable<ComplementaryTaskModel> {
    return this.oemService.put<ComplementaryTaskModel>(`/complementary-tasks/${id}`, task).pipe(
      catchError((err) => this.handleError('update', err))
    );
  }

  delete(id: string): Observable<void> {
    return this.oemService.delete<void>(`/complementary-tasks/${id}`).pipe(
      catchError((err) => this.handleError('delete', err))
    );
  }

  private handleError(context: string, error: any) {
    const errorMessage = error?.error?.message || error?.message || `ComplementaryTask service error in ${context}`;
    console.error('ComplementaryTaskService error:', errorMessage);
    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}
