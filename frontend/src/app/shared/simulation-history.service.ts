import { Injectable } from '@angular/core';

export interface SimulationRecord {
  id: string;
  date: string;           // ISO date
  dateLabel: string;      // "28/04/2026 23:10"
  scenarioName: string;
  input: {
    target_doctors: number;
    target_nurses: number;
    target_beds: number;
    available_equipment: number;
    active_patients: number;
    hospital_id: number;
  };
  result: {
    before: {
      waiting_time_minutes: number;
      bed_occupancy_rate: number;
      throughput_patients: number;
      resource_utilization: number;
      service_coverage: number;
      rho_doctors: number;
      rho_beds: number;
    };
    after: {
      waiting_time_minutes: number;
      bed_occupancy_rate: number;
      throughput_patients: number;
      resource_utilization: number;
      service_coverage: number;
      rho_doctors: number;
      rho_beds: number;
      lambda_rate: number;
      mu_rate: number;
    };
    improvements: {
      waiting_time: number;
      bed_occupancy: number;
      throughput: number;
      resource_utilization: number;
      service_coverage: number;
    };
  };
  // Projection temporelle (générée par Python)
  projections?: TimeProjection[];
  // Recommandations (générées par Python)
  recommendations?: Recommendation[];
}

export interface TimeProjection {
  month: number;          // 0 = maintenant, 1 = mois 1, 3 = mois 3, etc.
  label: string;          // "Maintenant", "Mois 1", "Mois 3", etc.
  waiting_time: number;
  bed_occupancy: number;
  throughput: number;
  resource_utilization: number;
  service_coverage: number;
  status: 'normal' | 'warning' | 'critical';
  // Facteurs dynamiques appliqués
  factors: {
    patient_growth: number;       // % croissance patients
    equipment_failure: number;    // % équipements en panne
    staff_turnover: number;       // % turnover personnel
  };
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'staff' | 'equipment' | 'beds' | 'process';
  title: string;
  description: string;
  action: string;
  impact: string;
  icon: string;
  triggerMonth?: number;  // À quel mois cette recommandation devient urgente
}

@Injectable({ providedIn: 'root' })
export class SimulationHistoryService {
  private readonly KEY = 'healthsim_history';
  private readonly MAX_RECORDS = 50;

  // Sauvegarder une nouvelle simulation
  save(record: Omit<SimulationRecord, 'id' | 'date' | 'dateLabel'>): SimulationRecord {
    const now = new Date();
    const newRecord: SimulationRecord = {
      ...record,
      id: `sim_${now.getTime()}`,
      date: now.toISOString(),
      dateLabel: now.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    };

    const history = this.getAll();
    history.unshift(newRecord); // Ajouter en tête

    // Limiter à MAX_RECORDS
    if (history.length > this.MAX_RECORDS) {
      history.splice(this.MAX_RECORDS);
    }

    try {
      localStorage.setItem(this.KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Erreur sauvegarde historique', e);
    }

    return newRecord;
  }

  // Récupérer tout l'historique
  getAll(): SimulationRecord[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Récupérer les N dernières simulations
  getRecent(n = 10): SimulationRecord[] {
    return this.getAll().slice(0, n);
  }

  // Récupérer une simulation par ID
  getById(id: string): SimulationRecord | null {
    return this.getAll().find(r => r.id === id) ?? null;
  }

  // Mettre à jour les projections et recommandations d'une simulation
  updateProjections(id: string, projections: TimeProjection[], recommendations: Recommendation[]): void {
    const history = this.getAll();
    const idx = history.findIndex(r => r.id === id);
    if (idx !== -1) {
      history[idx].projections = projections;
      history[idx].recommendations = recommendations;
      try {
        localStorage.setItem(this.KEY, JSON.stringify(history));
      } catch (e) {
        console.error('Erreur mise à jour projections', e);
      }
    }
  }

  // Supprimer une simulation
  delete(id: string): void {
    const history = this.getAll().filter(r => r.id !== id);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Erreur suppression', e);
    }
  }

  // Vider tout l'historique
  clear(): void {
    localStorage.removeItem(this.KEY);
  }

  // Obtenir les données de tendance pour un KPI donné
  getTrendData(kpi: keyof SimulationRecord['result']['after'], limit = 10): { date: string; value: number }[] {
    return this.getRecent(limit)
      .reverse()
      .map(r => ({
        date: r.dateLabel,
        value: r.result.after[kpi] as number,
      }));
  }

  // Comparer deux simulations
  compare(id1: string, id2: string) {
    const r1 = this.getById(id1);
    const r2 = this.getById(id2);
    if (!r1 || !r2) return null;

    return {
      sim1: r1,
      sim2: r2,
      diff: {
        waiting_time: r2.result.after.waiting_time_minutes - r1.result.after.waiting_time_minutes,
        bed_occupancy: r2.result.after.bed_occupancy_rate - r1.result.after.bed_occupancy_rate,
        throughput: r2.result.after.throughput_patients - r1.result.after.throughput_patients,
        resource_utilization: r2.result.after.resource_utilization - r1.result.after.resource_utilization,
        service_coverage: r2.result.after.service_coverage - r1.result.after.service_coverage,
      }
    };
  }
}