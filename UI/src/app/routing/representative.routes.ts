import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/representative/representative').then(m => m.Representative),
    data: { $localize: 'Representative' },
  }
];
