import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { StorageAreaModel } from '../models/storageArea.model';

@Injectable({
  providedIn: 'root'
})
export class StorageAreaService {

  constructor(private apiService: ApiService) {}

  getAllStorageAreas(): Observable<StorageAreaModel[]> {
    return this.apiService.get<StorageAreaModel[]>('/StorageArea');
  }

  getStorageAreaByCode(code: string): Observable<StorageAreaModel> {
    return this.apiService.get<StorageAreaModel>(`/StorageArea/ByCode/${code}`);
  }

  getStorageAreaById(id: number): Observable<StorageAreaModel> {
    return this.apiService.get<StorageAreaModel>(`/StorageArea/ByID/${id}`);
  }

  getStorageAreaByLocation(location: string): Observable<StorageAreaModel> {
    return this.apiService.get<StorageAreaModel>(`/StorageArea/ByLocation/${location}`);
  }

  createStorageArea(storageArea: StorageAreaModel): Observable<StorageAreaModel> {
    return this.apiService.post<StorageAreaModel>('/StorageArea', storageArea);
  }

  updateStorageArea(id: number, storageArea: StorageAreaModel): Observable<any> {
    return this.apiService.put<any>(`/StorageArea/Update/${id}`, storageArea);
  }
}
