import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Hospital, Service, Alert, SummaryStats, DashboardStats, Id, Equipment } from './models';

const BASE = 'http://127.0.0.1:8000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  listHospitals(): Observable<Hospital[]> { return this.http.get<Hospital[]>(`${BASE}/hospitals`); }
  getHospital(id: Id): Observable<Hospital> { return this.http.get<Hospital>(`${BASE}/hospitals/${id}`); }
  getHospitalDashboard(id: Id): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${BASE}/hospitals/${id}/dashboard`); }
  getHospitalAlerts(id: Id): Observable<Alert[]> { return this.http.get<Alert[]>(`${BASE}/hospitals/${id}/alerts`); }
  listServices(hospitalId: Id): Observable<Service[]> { return this.http.get<Service[]>(`${BASE}/hospitals/${hospitalId}/services`); }

  createService(hospitalId: Id, data: { name: string; head: string; doctors: number; nurses: number; beds: number; equipment?: Array<{ name: string; type: string; quantity: number; status: string }> }) {
    return this.http.post<Service>(`${BASE}/hospitals/${hospitalId}/services`, data);
  }
  deleteService(serviceId: Id) {
    return this.http.delete(`${BASE}/services/${serviceId}`);
  }
  addServiceEquipment(serviceId: Id, data: { name: string; type: string; quantity: number; status: string }) {
    return this.http.post<Equipment>(`${BASE}/services/${serviceId}/equipment`, data);
  }
  transferStaff(serviceId: Id, body: { targetServiceId: Id; staffType: 'doctor' | 'nurse'; count: number }) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-staff`, body);
  }
  transferEquipment(serviceId: Id, body: { targetServiceId: Id; equipmentId: Id; quantity: number }) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-equipment`, body);
  }

  getSummary(): Observable<SummaryStats> { return this.http.get<SummaryStats>(`${BASE}/summary`); }
  listAlerts(): Observable<Alert[]> { return this.http.get<Alert[]>(`${BASE}/alerts`); }

  runSimulation(data: {
    hospital_id: number;
    scenario_name: string;
    target_doctors: number;
    target_nurses: number;
    target_beds: number;
    available_equipment: number;
  }) {
    return this.http.post(`${BASE}/simulations`, data);
  }
}
