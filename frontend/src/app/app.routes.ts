import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/map/map.component').then(m => m.MapComponent) },
  { path: 'hospitals/:id', loadComponent: () => import('./pages/hospital-dashboard/hospital-dashboard.component').then(m => m.HospitalDashboardComponent) },
  { path: 'hospitals/:id/services', loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent) },
  { path: 'simulation', loadComponent: () => import('./pages/simulation/simulation.component').then(m => m.SimulationComponent) },
  { path: 'simulation-result', loadComponent: () => import('./pages/simulation/simulation-result.component').then(m => m.SimulationResultComponent) },
  { path: 'alerts', loadComponent: () => import('./pages/alerts/alerts.component').then(m => m.AlertsComponent) },
  { path: '**', redirectTo: '' },
];
