import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/systemUser/systemUser').then(m => m.SystemUser),
    data: { $localize: 'System Users' },
  }
];
