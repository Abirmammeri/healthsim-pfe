import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SimulationStoreService {

  // ── Stockage en mémoire ───────────────────────────────────
  private _result: any = null;
  private _scenarioState: any = null;
  private _historicalLoad: { hospitalId: number; services: any[] } | null = null;

  // ── Résultat de la simulation ─────────────────────────────
  set(data: any) {
    this._result = data;
  }

  get(): any {
    return this._result;
  }

  clear() {
    this._result = null;
  }

  // ── État du scénario ──────────────────────────────────────
  saveScenarioState(state: {
    hospitalId:        number;
    services:          any[];
    newServiceIds:     number[];
    deletedServiceIds: number[];
  }) {
    this._scenarioState = state;
  }

  getScenarioState(): {
    hospitalId:        number;
    services:          any[];
    newServiceIds:     number[];
    deletedServiceIds: number[];
  } | null {
    return this._scenarioState;
  }

  clearScenarioState() {
    this._scenarioState = null;
  }

  // ── Chargement depuis l'historique (consommé une seule fois) ──
  setHistoricalLoad(state: { hospitalId: number; services: any[] }) {
    this._historicalLoad = state;
  }

  getHistoricalLoad(): { hospitalId: number; services: any[] } | null {
    return this._historicalLoad;
  }

  clearHistoricalLoad() {
    this._historicalLoad = null;
  }
}