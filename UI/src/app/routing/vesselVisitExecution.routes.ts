import { Routes } from '@angular/router';
import { roleGuard } from '../auth/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/vesselVisitExecution/vesselVisitExecution').then(m => m.VesselVisitExecution),
        data: { $localize: 'vesselVisitExecution', roles: ['Admin', 'LogisticOperator'] },
        canActivate: [roleGuard]
    }
];