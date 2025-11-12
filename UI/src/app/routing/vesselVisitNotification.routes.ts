import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/vesselVisitNotification/vesselVisitNotification').then(m => m.VesselVisitNotification),
    data: { $localize: 'Vessel Visit Notification' },
  }
];
