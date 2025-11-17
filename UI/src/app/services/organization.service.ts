import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ShippingAgentOrganizationModel, ShippingAgentOrganizationWithRepresentativeModel, RepresentativeModel } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = 'http://141.253.198.138:5000/api/ShippingAgentOrganization';

  constructor(private http: HttpClient) { }

  getAllOrganizations(): Observable<ShippingAgentOrganizationWithRepresentativeModel[]> {
    return this.http.get<ShippingAgentOrganizationWithRepresentativeModel[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  getOrganizationById(id: number): Observable<ShippingAgentOrganizationWithRepresentativeModel> {
    return this.http.get<ShippingAgentOrganizationWithRepresentativeModel>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createOrganization(organization: ShippingAgentOrganizationWithRepresentativeModel): Observable<ShippingAgentOrganizationWithRepresentativeModel> {
    return this.http.post<ShippingAgentOrganizationWithRepresentativeModel>(this.apiUrl, organization)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateOrganization(id: number, organization: ShippingAgentOrganizationModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/Update/${id}`, organization)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteOrganization(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Representative management
  addRepresentativeToOrganization(organizationId: number, representative: RepresentativeModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/${organizationId}/representatives`, representative)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateRepresentative(organizationId: number, representative: RepresentativeModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/${organizationId}/representatives`, representative)
      .pipe(
        catchError(this.handleError)
      );
  }

  removeRepresentativeFromOrganization(organizationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${organizationId}/representatives`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Bad request';
      } else if (error.status === 404) {
        errorMessage = 'Organization not found';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflict occurred';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error occurred';
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
