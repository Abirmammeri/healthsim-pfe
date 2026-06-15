import { Routes } from '@angular/router';
import { authGuard, directeurGuard, serviceGuard } from './shared/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./pages/map/map.component').then(m => m.MapComponent),
    canActivate: [authGuard],
  },
  {
    path: 'hospitals/:id',
    loadComponent: () => import('./pages/hospital-dashboard/hospital-dashboard.component').then(m => m.HospitalDashboardComponent),
    canActivate: [directeurGuard],
  },
  {
    path: 'hospitals/:id/services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent),
    canActivate: [directeurGuard],
  },
  {
    path: 'hospitals/:id/services/:svcId',
    loadComponent: () => import('./pages/services/service-detail.component').then(m => m.ServiceDetailComponent),
    canActivate: [authGuard, serviceGuard],
  },
  {
    path: 'hospitals/:id/services/:svcId/kpi/:category',
    loadComponent: () => import('./pages/services/service-kpi-category.component').then(m => m.ServiceKpiCategoryComponent),
    canActivate: [authGuard, serviceGuard],
  },
  {
    path: 'simulation',
    loadComponent: () => import('./pages/simulation/simulation.component').then(m => m.SimulationComponent),
    canActivate: [authGuard],
  },
  {
    path: 'simulation-result',
    loadComponent: () => import('./pages/simulation/simulation-result.component').then(m => m.SimulationResultComponent),
    canActivate: [authGuard],
  },
  {
    path: 'simulation-history',
    loadComponent: () => import('./pages/simulation-history/simulation-history.component').then(m => m.SimulationHistoryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'doctors',
    loadComponent: () => import('./pages/doctors/doctors.component').then(m => m.DoctorsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'alerts',
    loadComponent: () => import('./pages/alerts/alerts.component').then(m => m.AlertsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'messaging',
    loadComponent: () => import('./pages/messaging/messaging.component').then(m => m.MessagingComponent),
    canActivate: [authGuard],
  },
  // Paramètres du service — chef de service uniquement
  {
    path: 'service-params',
    loadComponent: () => import('./pages/service-params/service-params.component').then(m => m.ServiceParamsComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];