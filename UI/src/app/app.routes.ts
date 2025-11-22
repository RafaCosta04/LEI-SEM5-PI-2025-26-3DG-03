import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayout),
    canActivate: [authGuard],
    data: { title: 'Dashboard' },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./routing/dashboard.routes').then((m) => m.routes)
      },
      {
        path: 'qualification',
        data: { title: 'Qualification' , breadcrumb: 'Qualification'},
        loadChildren: () => import('./routing/qualification.routes').then((m) => m.routes)
      },
      {
        path: 'physicalResources',
        data: { title: 'Physical Resources', breadcrumb: 'Physical Resources' },
        loadChildren: () => import('./routing/physicalResources.routes').then((m) => m.routes)
      },
      {
        path: 'docks',
        data: { title: 'Docks', breadcrumb: 'Docks' },
        loadChildren: () => import('./routing/docks.routes').then((m) => m.routes)
      },
      {
        path: 'staff',
        data: { title: 'Staff', breadcrumb: 'Staff' },
        loadChildren: () => import('./routing/staff.routes').then((m) => m.routes)
      },
      {
        path: 'storageArea',
        data: { title: 'Storage Area', breadcrumb: 'Storage Area' },
        loadChildren: () => import('./routing/storageArea.routes').then((m) => m.routes)
      },
      {
        path: 'vesselType',
        data: { title: 'Vessel Type', breadcrumb: 'Vessel Type' },
        loadChildren: () => import('./routing/vesselType.routes').then((m) => m.routes)
      },
      {
        path: 'vessel',
        data: { title: 'Vessel', breadcrumb: 'Vessel' },
        loadChildren: () => import('./routing/vessel.routes').then((m) => m.routes)
      },
      {
        path: 'organization',
        data: { title: 'Organization', breadcrumb: 'Organization' },
        loadChildren: () => import('./routing/organization.routes').then((m) => m.routes)
      },
      {
        path: 'representative',
        data: { title: 'Representative', breadcrumb: 'Representative' },
        loadChildren: () => import('./routing/representative.routes').then((m) => m.routes)
      },
      {
        path: 'vvncreate',
        data: { title: 'Vessel Visit Notification', breadcrumb: 'Vessel Visit Notification' },
        loadChildren: () => import('./routing/vesselVisitNotification.routes').then((m) => m.routes)
      },
      {
        path: 'vvndecision',
        data: { title: 'Vessel Visit Notification Decision', breadcrumb: 'Decision' },
        loadChildren: () => import('./routing/vesselVisitNotificationDecision.routes').then((m) => m.routes)
      },
      {
        path: 'schedule',
        data: { title: 'Schedule', breadcrumb: 'Schedule' },
        loadChildren: () => import('./routing/schedule.routes').then((m) => m.routes)
      },
      {
        path: 'user',
        loadChildren: () => import('./routing/systemUser.routes').then((m) => m.routes)
      }
    ],
  },
  {
    path: 'v',
    loadComponent: () => import('./components/visualization/visualization').then(m => m.PortVisualizationComponent),
    data: { title: '3D Port Visualization' }
  }
];
