import { Routes } from '@angular/router';
import { roleGuard } from '../auth/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/complementaryTask/complementaryTask').then(m => m.ComplementaryTask),
        data: { $localize: 'complementaryTask', roles: ['Admin', 'LogisticOperator', 'PortAuthorityOfficer'] },
        canActivate: [roleGuard]
    }
];
