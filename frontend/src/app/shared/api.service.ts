import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Hospital, Service, Alert, SummaryStats,
  DashboardStats, Id, Equipment
} from './models';

import { environment } from '../../environments/environment';
const BASE = environment.apiUrl;
const SIM  = environment.simUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ── Hospitals ──────────────────────────────────────────
  listHospitals(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${BASE}/hospitals`);
  }
  getHospital(id: Id): Observable<Hospital> {
    return this.http.get<Hospital>(`${BASE}/hospitals/${id}`);
  }
  getHospitalDashboard(id: Id): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${BASE}/hospitals/${id}/dashboard`);
  }
  getHospitalAlerts(id: Id): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${BASE}/hospitals/${id}/alerts`);
  }
  getHospitalKpis(id: Id): Observable<any> {
    return this.http.get<any>(`${BASE}/hospitals/${id}/kpis`);
  }
  updateHospital(id: Id, data: any): Observable<Hospital> {
    return this.http.put<Hospital>(`${BASE}/hospitals/${id}`, data);
  }

  // ── Services ───────────────────────────────────────────
  listServices(hospitalId: Id): Observable<Service[]> {
    return this.http.get<any[]>(`${BASE}/hospitals/${hospitalId}/services`).pipe(
      map(list => list.map(s => ({
        ...s,
        hospitalId:      s.hospital_id   ?? s.hospitalId,
        simulationHours: s.simulation_hours ?? s.simulationHours ?? 24,
        availableBeds:   s.available_beds != null
          ? s.available_beds
          : Math.max(0, (s.beds || 0) - (s.patients || 0)),
      } as Service)))
    );
  }
  getServiceKpis(serviceId: Id): Observable<any> {
    return this.http.get<any>(`${BASE}/services/${serviceId}/kpis`);
  }
  updateServiceKpiTerrain(serviceId: Id, data: any): Observable<any> {
    return this.http.put<any>(`${BASE}/services/${serviceId}/kpi-terrain`, data);
  }
  createService(hospitalId: Id, data: any) {
    return this.http.post<Service>(`${BASE}/hospitals/${hospitalId}/services`, data);
  }
  updateService(serviceId: Id, data: any): Observable<Service> {
    return this.http.put<Service>(`${BASE}/services/${serviceId}`, data);
  }
  deleteService(serviceId: Id) {
    return this.http.delete(`${BASE}/services/${serviceId}`);
  }

  // ── Equipment ──────────────────────────────────────────
  addServiceEquipment(serviceId: Id, data: any) {
    return this.http.post<Equipment>(`${BASE}/services/${serviceId}/equipment`, data);
  }
  transferEquipment(serviceId: Id, body: any) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-equipment`, body);
  }
  getServiceEquipments(serviceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/services/${serviceId}/equipments`);
  }
  updateEquipment(id: number, data: any): Observable<any> {
    return this.http.put(`${BASE}/equipments/${id}`, data);
  }

  // ── Staff ──────────────────────────────────────────────
  transferStaff(serviceId: Id, body: any) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-staff`, body);
  }

  // ── Summary & Alerts ───────────────────────────────────
  getSummary(): Observable<SummaryStats> {
    return this.http.get<SummaryStats>(`${BASE}/summary`);
  }
  listAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${BASE}/alerts`);
  }

  // ── Simulation Python ──────────────────────────────────
  runSimulation(data: any) {
    return this.http.post(`${SIM}/simulate`, data);
  }

  // KPIs temps réel service via Python
  getServiceKpisRealtime(data: any): Observable<any> {
    return this.http.post<any>(`${SIM}/service-kpis`, data);
  }

  // ── Simulations Laravel ────────────────────────────────
  getHospitalSimulations(hospitalId: Id, params?: any): Observable<any[]> {
    let url = `${BASE}/hospitals/${hospitalId}/simulations`;
    if (params?.date)   url += `?date=${params.date}`;
    if (params?.statut) url += `?statut=${params.statut}`;
    return this.http.get<any[]>(url);
  }
  getRecentSimulations(hospitalId: Id): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/hospitals/${hospitalId}/simulations/recent`);
  }
  getSimulation(id: Id): Observable<any> {
    return this.http.get<any>(`${BASE}/simulations/${id}`);
  }
  saveSimulation(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/simulations`, data);
  }
  applySimulation(id: Id): Observable<any> {
    return this.http.post<any>(`${BASE}/simulations/${id}/apply`, {});
  }
  archiveSimulation(id: Id): Observable<any> {
    return this.http.put<any>(`${BASE}/simulations/${id}/archive`, {});
  }
  getSimulationServiceSnapshots(id: Id): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/simulations/${id}/services`);
  }

  // Ancien applyScenario (compatibilité)
  applyScenario(hospitalId: number, data: any) {
    return this.http.patch(`${BASE}/hospitals/${hospitalId}/apply-scenario`, data);
  }

  // ── KPI Snapshots ──────────────────────────────────────
  computeKpiSnapshots(hospitalId?: number, serviceId?: number): Observable<any> {
    return this.http.post<any>(`${BASE}/kpi-snapshots/compute`, {
      hospital_id: hospitalId,
      service_id:  serviceId,
    });
  }
  getServiceKpiHistory(serviceId: Id): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/services/${serviceId}/kpi-history`);
  }
  getHospitalKpiHistory(hospitalId: Id): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/hospitals/${hospitalId}/kpi-history`);
  }
}