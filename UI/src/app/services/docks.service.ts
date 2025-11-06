import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocksModel } from '../models/docks.model';

@Injectable({
  providedIn: 'root'
})
export class DocksService {

  constructor(private apiService: ApiService) {}

  getAllDocks(): Observable<DocksModel[]> {
    return this.apiService.get<DocksModel[]>('/Dock');
  }

  getDocksByName(name: string): Observable<DocksModel[]> {
    return this.apiService.get<DocksModel[]>(`/Dock/ByName/${name}`);
  }

  getDocksByLocation(location: string): Observable<DocksModel[]> {
    return this.apiService.get<DocksModel[]>(`/Dock/ByLocation/${location}`);
  }

  getDocksById(id: number): Observable<DocksModel> {
    return this.apiService.get<DocksModel>(`/Dock/ByID/${id}`);
  }

  getDocksByVesselType(vesselType: string): Observable<DocksModel[]> {
    return this.apiService.get<DocksModel[]>(`/Dock/ByVesselType`);
  }

  createDock(dock: DocksModel): Observable<DocksModel> {
    return this.apiService.post<DocksModel>('/Dock', dock);
  }

  updateDock(id: number, dock: DocksModel): Observable<any> {
    return this.apiService.put<any>(`/Dock/Update/${id}`, dock);
  }
}
