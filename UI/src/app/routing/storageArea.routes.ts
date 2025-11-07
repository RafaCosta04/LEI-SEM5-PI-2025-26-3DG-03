import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/storageArea/storageArea').then(m => m.StorageArea),
    data: { $localize: 'Storage Area' },
  }
];
