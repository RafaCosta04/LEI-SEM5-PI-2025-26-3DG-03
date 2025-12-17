import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VesselVisitNotificationDecisionModel } from '../models/vesselVisitNotificationDecision.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VesselVisitNotificationDecisionService {

  constructor(private apiService: ApiService) { }

  getAllDecisions(): Observable<VesselVisitNotificationDecisionModel[]> {
    return this.apiService.get<VesselVisitNotificationDecisionModel[]>('/VesselVisitNotification/Decision')
      .pipe(
        catchError(this.handleError)
      );
  }

  getDecisionById(id: number): Observable<VesselVisitNotificationDecisionModel> {
    return this.apiService.get<VesselVisitNotificationDecisionModel>(`/VesselVisitNotification/DecisionById/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createDecision(decision: VesselVisitNotificationDecisionModel): Observable<VesselVisitNotificationDecisionModel> {
    return this.apiService.post<VesselVisitNotificationDecisionModel>('/VesselVisitNotification/Decision', decision)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && Array.isArray(error.error)) {
        errorMessage = error.error.join(', ');
      }
    }

    console.error('VesselVisitNotificationDecisionService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
