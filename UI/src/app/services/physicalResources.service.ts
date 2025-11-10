import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PhysicalResourceModel, PhysicalResourceKind, ResourceStatus } from '../models/physicalResources.model';

@Injectable({
  providedIn: 'root'
})
export class PhysicalResourcesService {

  constructor(private apiService: ApiService) {}

  getAllPhysicalResources(): Observable<PhysicalResourceModel[]> {
    return this.apiService.get<PhysicalResourceModel[]>('/PhysicalResources');
  }

  getPhysicalResourceByCode(code: string): Observable<PhysicalResourceModel> {
    return this.apiService.get<PhysicalResourceModel>(`/PhysicalResources/ByCode/${code}`);
  }

  getPhysicalResourcesByDescription(description: string): Observable<PhysicalResourceModel[]> {
    return this.apiService.get<PhysicalResourceModel[]>(`/PhysicalResources/ByDescription/${description}`);
  }

  getPhysicalResourcesByKind(kind: PhysicalResourceKind): Observable<PhysicalResourceModel[]> {
    return this.apiService.get<PhysicalResourceModel[]>(`/PhysicalResources/ByKind/${kind}`);
  }

  getPhysicalResourcesByStatus(status: ResourceStatus): Observable<PhysicalResourceModel[]> {
    return this.apiService.get<PhysicalResourceModel[]>(`/PhysicalResources/ByStatus/${status}`);
  }

  createPhysicalResource(resource: PhysicalResourceModel): Observable<PhysicalResourceModel> {
    return this.apiService.post<PhysicalResourceModel>('/PhysicalResources', resource);
  }

  updatePhysicalResource(id: number, resource: PhysicalResourceModel): Observable<any> {
    return this.apiService.put<any>(`/PhysicalResources/Update/${id}`, resource);
  }

  // Helper method to get available docks
  getAvailableDocks(): Observable<string[]> {
    return this.apiService.get<string[]>('/PhysicalResources/AvailableDocks');
  }

  // Helper method to get available storage areas
  getAvailableStorageAreas(): Observable<string[]> {
    return this.apiService.get<string[]>('/PhysicalResources/AvailableStorageAreas');
  }
}
