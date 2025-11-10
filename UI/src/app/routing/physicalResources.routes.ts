import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/physicalResources/physicalResources').then(m => m.PhysicalResources),
    data: { title: 'Physical Resources' },
  }
];
