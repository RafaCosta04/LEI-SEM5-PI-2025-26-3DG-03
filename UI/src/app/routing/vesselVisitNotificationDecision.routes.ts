import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/vesselVisitNotificationDecision/vesselVisitNotificationDecision').then(m => m.VesselVisitNotificationDecision),
    data: { title: 'Vessel Visit Notification Decision' },
  }
];
