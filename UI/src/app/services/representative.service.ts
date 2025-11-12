import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RepresentativeModel } from '../models/representative.model';

@Injectable({
  providedIn: 'root'
})
export class RepresentativeService {
  private apiUrl = 'http://141.253.198.138:5000/api/Representative';

  constructor(private http: HttpClient) { }

  getAllRepresentatives(): Observable<RepresentativeModel[]> {
    return this.http.get<RepresentativeModel[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativeById(id: number): Observable<RepresentativeModel> {
    return this.http.get<RepresentativeModel>(`${this.apiUrl}/ByID/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativeByEmail(email: string): Observable<RepresentativeModel> {
    return this.http.get<RepresentativeModel>(`${this.apiUrl}/ByEmail/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativeByPhoneNumber(phoneNumber: string): Observable<RepresentativeModel> {
    return this.http.get<RepresentativeModel>(`${this.apiUrl}/ByPhoneNumber/${phoneNumber}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativeByCitizenId(citizenId: string): Observable<RepresentativeModel> {
    return this.http.get<RepresentativeModel>(`${this.apiUrl}/ByCitizenId/${citizenId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativeByName(name: string): Observable<RepresentativeModel> {
    return this.http.get<RepresentativeModel>(`${this.apiUrl}/ByName/${name}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepresentativesByOrganization(organizationName: string): Observable<RepresentativeModel[]> {
    return this.http.get<RepresentativeModel[]>(`${this.apiUrl}/ByOrganization/${organizationName}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createRepresentative(representative: RepresentativeModel): Observable<RepresentativeModel> {
    return this.http.post<RepresentativeModel>(this.apiUrl, representative)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateRepresentative(id: number, representative: RepresentativeModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/Update/${id}`, representative)
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
        errorMessage = 'Representative not found';
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
