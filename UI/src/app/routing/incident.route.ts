import { Routes } from '@angular/router';
import { roleGuard } from '../auth/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/incident/incident').then(m => m.Incident),
        data: { $localize: 'incident', roles: ['Admin', 'LogisticOperator'] },
        canActivate: [roleGuard]
    }
];