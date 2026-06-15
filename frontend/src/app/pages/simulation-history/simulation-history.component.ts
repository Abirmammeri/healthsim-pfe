// src/app/pages/simulation-history/simulation-history.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { SimulationStoreService } from '../../shared/simulation-store.service';

const BASE = 'http://localhost:8000/api';
const PRIMARY = '#00BCD4';
const PRIMARY_DARK = '#0288D1';

@Component({
  selector: 'app-simulation-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background">

  <!-- HEADER -->
  <div class="px-6 py-5 bg-card border-b flex items-center gap-3">
    <button (click)="goBack()" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center">
      <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
    </button>
    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
         style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
      <lucide-icon name="clock" class="w-5 h-5 text-white"></lucide-icon>
    </div>
    <div>
      <h1 class="text-lg font-bold text-foreground">Historique des simulations</h1>
      <p class="text-xs text-muted-foreground">Retrouvez toutes vos simulations passées avec date et heure exactes</p>
    </div>
    <div class="ml-auto">
      <span class="text-xs px-3 py-1.5 rounded-full font-semibold bg-muted text-muted-foreground">
        {{ history().length }} simulation(s)
      </span>
    </div>
  </div>

  <!-- CONTENU -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-4xl mx-auto">

      <!-- Chargement -->
      <div *ngIf="loading()" class="text-center py-12 text-sm text-muted-foreground">
        <lucide-icon name="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2" style="color:#00BCD4"></lucide-icon>
        Chargement de l'historique...
      </div>

      <!-- Vide -->
      <div *ngIf="!loading() && history().length === 0"
           class="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
             style="background:linear-gradient(135deg,#00BCD415,#0288D115)">
          <lucide-icon name="clock" class="w-8 h-8" style="color:#00BCD4"></lucide-icon>
        </div>
        <div class="font-bold text-foreground text-lg mb-2">Aucune simulation sauvegardée</div>
        <p class="text-sm text-muted-foreground mb-5">Lancez votre première simulation pour la retrouver ici.</p>
        <a routerLink="/simulation"
           class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm inline-flex items-center gap-2"
           style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
          <lucide-icon name="brain" class="w-4 h-4"></lucide-icon>
          Lancer une simulation
        </a>
      </div>

      <!-- Liste des simulations -->
      <div class="space-y-3" *ngIf="!loading() && history().length > 0">
        <div *ngFor="let sim of history()"
             class="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
             (click)="loadSimulation(sim)">
          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style="background:linear-gradient(135deg,#00BCD420,#0288D120)">
                  <lucide-icon name="brain" class="w-5 h-5" style="color:#00BCD4"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-foreground mb-1">{{ sim.scenario_name }}</div>
                  <!-- Date et heure exactes -->
                  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <lucide-icon name="clock" class="w-3 h-3 flex-shrink-0"></lucide-icon>
                    <span class="font-semibold text-foreground">{{ formatDate(sim.created_at) }}</span>
                    <span>·</span>
                    <span class="font-semibold" style="color:#00BCD4">{{ formatTime(sim.created_at) }}</span>
                  </div>
                  <!-- KPIs résumé -->
                  <div class="flex flex-wrap gap-2">
                    <span class="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
                      {{ sim.input_data?.target_doctors || 0 }} médecins
                    </span>
                    <span class="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
                      {{ sim.input_data?.target_nurses || 0 }} infirmiers
                    </span>
                    <span class="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
                      {{ sim.input_data?.target_beds || 0 }} lits
                    </span>
                    <span *ngIf="sim.result_data?.after?.waiting_time_minutes !== undefined"
                          class="text-[10px] px-2 py-1 rounded-full font-semibold"
                          [style.background]="waitColor(sim.result_data?.after?.waiting_time_minutes)+'15'"
                          [style.color]="waitColor(sim.result_data?.after?.waiting_time_minutes)">
                      Attente: {{ sim.result_data?.after?.waiting_time_minutes | number:'1.0-0' }}min
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button (click)="loadSimulation(sim); $event.stopPropagation()"
                        class="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5"
                        style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
                  <lucide-icon name="clock" class="w-3.5 h-3.5"></lucide-icon>
                  Reprendre
                </button>
                <button (click)="deleteSimulation(sim.id, $event)"
                        class="p-2 rounded-xl border border-border hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                  <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
})
export class SimulationHistoryComponent implements OnInit {
  private http   = inject(HttpClient);
  private store  = inject(SimulationStoreService);
  private router = inject(Router);

  history = signal<any[]>([]);
  loading = signal(false);

  goBack() { this.router.navigate(['/simulation']); }

  ngOnInit() { this.loadHistory(); }

  loadHistory() {
    this.loading.set(true);
    this.http.get<any[]>(`${BASE}/simulation-history`).subscribe({
      next: h => { this.history.set(h); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  waitColor(val: number): string {
    if (val <= 20) return '#43A047';
    if (val <= 40) return '#FB8C00';
    return '#E53935';
  }

  loadSimulation(sim: any) {
    this.store.saveScenarioState({
      hospitalId:        sim.input_data?.hospital_id,
      services:          sim.input_data?.services || [],
      newServiceIds:     [],
      deletedServiceIds: [],
    });
    this.router.navigate(['/simulation']);
  }

  deleteSimulation(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Supprimer cette simulation ?')) return;
    this.http.delete(`${BASE}/simulation-history/${id}`).subscribe({
      next: () => this.history.set(this.history().filter(h => h.id !== id)),
      error: () => {}
    });
  }
}
