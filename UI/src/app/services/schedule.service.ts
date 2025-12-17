import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable, throwError } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
   providedIn: 'root'
})
export class ScheduleService {
  constructor(private apiService: ApiService) {}

    getScheduleByTargetDay(targetDay: string, algorithm: string = 'default', timeLimit?: number): Observable<ScheduleModel> {
      const encoded = encodeURIComponent(targetDay);
      const alg = encodeURIComponent(algorithm || 'default');
      
      let url = `/Scheduling?targetDay=${encoded}&algorithm=${alg}`;
      if (timeLimit !== undefined && timeLimit !== null) {
        url += `&timeLimit=${timeLimit}`;
      }
      
      return this.apiService.get<ScheduleModel>(url);
    }

    getScheduleWithGeneticAlgorithm(
      targetDay: string,
      populationSize: number,
      generations: number,
      crossoverRate: number,
      mutationRate: number,
      desiredTime: number,
      stableGenerations: number,
      enableMultiCrane: boolean
    ): Observable<ScheduleModel> {
      const encoded = encodeURIComponent(targetDay);
      return this.apiService.get<ScheduleModel>(
        `/Scheduling/GeneticAlgorithm?targetDay=${encoded}&populationSize=${populationSize}&generations=${generations}&crossoverRate=${crossoverRate}&mutationRate=${mutationRate}&desiredTime=${desiredTime}&stableGenerations=${stableGenerations}&enableMultiCrane=${enableMultiCrane}`
      );
    }

}
