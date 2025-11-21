import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private role$ = new BehaviorSubject<string | null>(null);

  setRole(role: string) {
    this.role$.next(role);
    localStorage.setItem('userRole', role);
  }

  loadRoleFromStorage(): Promise<void> {
    return new Promise(resolve => {
      const r = localStorage.getItem('userRole');
      if (r) {
        this.role$.next(r);
      }
      resolve();
    });
  }

  getRole(): string | null {
    return this.role$.value;
  }

  hasRole(role: string): boolean {
    return this.role$.value === role;
  }

  clearRole() {
    this.role$.next(null);
    localStorage.removeItem('userRole');
  }

  roleChanges() {
    return this.role$.asObservable();
  }
}
