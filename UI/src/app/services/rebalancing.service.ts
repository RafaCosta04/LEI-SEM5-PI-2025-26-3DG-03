import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RebalancingService {
  constructor(private http: HttpClient, private api: ApiService) {}

  postRebalancing(payload: any) {
    const url = `${this.api.getBaseUrl()}/Scheduling/RebalancingAlgorithm`;
    return this.http.post(url, payload);
  }
}
