import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SimulationStoreService } from '../../shared/simulation-store.service';

const PRIMARY = '#00BCD4';
const PRIMARY_DARK = '#0288D1';
const GREEN = '#43A047';
const ORANGE = '#FB8C00';
const RED = '#E53935';

@Component({
  selector: 'app-simulation-result',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <ng-container *ngIf="data() as d; else empty">
      <div class="flex flex-col h-full bg-background">

        <!-- HEADER -->
        <div class="px-6 lg:px-8 py-5 bg-card border-b">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <a routerLink="/simulation"
                 class="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
                <lucide-icon name="arrow-left" class="w-5 h-5 text-foreground"></lucide-icon>
              </a>
              <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                   style="background: linear-gradient(135deg, #00BCD4, #0288D1);">
                <lucide-icon name="activity" class="w-6 h-6 text-white"></lucide-icon>
              </div>
              <div>
                <h1 class="text-xl font-bold text-foreground font-display">Résultats de la simulation</h1>
                <p class="text-sm text-muted-foreground">KPIs, charge par service, équipements critiques et comparaison AVANT vs APRÈS</p>
              </div>
            </div>
            <span class="text-sm px-3 py-1.5 rounded-full font-bold"
                  [style.backgroundColor]="GREEN + '15'" [style.color]="GREEN">
              Scénario : {{ d.result?.scenario_name || 'Simulation DES' }}
            </span>
          </div>
        </div>

        <!-- BODY -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="max-w-5xl mx-auto space-y-5">

            <!-- KPIs Globaux -->
            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h2 class="font-bold text-foreground flex items-center gap-2 mb-4">
                <lucide-icon name="activity" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
                KPIs Globaux
              </h2>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

                <!-- Temps d'attente -->
                <div class="rounded-xl border border-border p-4 bg-muted/20">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <lucide-icon name="clock" class="w-3.5 h-3.5"></lucide-icon>
                    Temps d'attente
                  </div>
                  <div class="text-2xl font-bold text-foreground">
                    {{ d.result?.after?.waiting_time_minutes || 0 }}
                    <span class="text-sm font-normal text-muted-foreground ml-1">min</span>
                  </div>
                  <div class="text-xs font-semibold mt-1"
                       [style.color]="(d.result?.improvements?.waiting_time || 0) >= 0 ? GREEN : RED">
                    {{ (d.result?.improvements?.waiting_time || 0) >= 0 ? '↓' : '↑' }}
                    {{ (d.result?.improvements?.waiting_time || 0).toFixed(1) }}% vs avant
                  </div>
                </div>

                <!-- Taux d'occupation lits -->
                <div class="rounded-xl border border-border p-4 bg-muted/20">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <lucide-icon name="bed" class="w-3.5 h-3.5"></lucide-icon>
                    Occupation lits
                  </div>
                  <div class="text-2xl font-bold text-foreground">
                    {{ d.result?.after?.bed_occupancy_rate || 0 }}
                    <span class="text-sm font-normal text-muted-foreground ml-1">%</span>
                  </div>
                  <div class="text-xs font-semibold mt-1"
                       [style.color]="(d.result?.improvements?.bed_occupancy || 0) >= 0 ? GREEN : RED">
                    {{ (d.result?.improvements?.bed_occupancy || 0) >= 0 ? '↓' : '↑' }}
                    {{ (d.result?.improvements?.bed_occupancy || 0).toFixed(1) }}% vs avant
                  </div>
                </div>

                <!-- Débit patients -->
                <div class="rounded-xl border border-border p-4 bg-muted/20">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <lucide-icon name="trending-up" class="w-3.5 h-3.5"></lucide-icon>
                    Débit patients
                  </div>
                  <div class="text-2xl font-bold text-foreground">
                    {{ d.result?.after?.throughput_patients || 0 }}
                    <span class="text-sm font-normal text-muted-foreground ml-1">/jour</span>
                  </div>
                  <div class="text-xs font-semibold mt-1"
                       [style.color]="(d.result?.improvements?.throughput || 0) >= 0 ? GREEN : RED">
                    {{ (d.result?.improvements?.throughput || 0) >= 0 ? '↑' : '↓' }}
                    {{ (d.result?.improvements?.throughput || 0).toFixed(1) }}% vs avant
                  </div>
                </div>

                <!-- Taux d'utilisation -->
                <div class="rounded-xl border border-border p-4 bg-muted/20">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <lucide-icon name="users" class="w-3.5 h-3.5"></lucide-icon>
                    Utilisation ressources
                  </div>
                  <div class="text-2xl font-bold text-foreground">
                    {{ d.result?.after?.resource_utilization || 0 }}
                    <span class="text-sm font-normal text-muted-foreground ml-1">%</span>
                  </div>
                  <div class="text-xs font-semibold mt-1"
                       [style.color]="(d.result?.improvements?.resource_utilization || 0) >= 0 ? GREEN : RED">
                    {{ (d.result?.improvements?.resource_utilization || 0) >= 0 ? '↓' : '↑' }}
                    {{ (d.result?.improvements?.resource_utilization || 0).toFixed(1) }}% vs avant
                  </div>
                </div>

              </div>
            </div>

            <!-- Paramètres DES -->
            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h2 class="font-bold text-foreground flex items-center gap-2 mb-4">
                <lucide-icon name="cpu" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
                Paramètres du modèle DES
              </h2>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div class="bg-muted/30 rounded-lg p-3">
                  <div class="text-muted-foreground text-xs mb-1">λ (taux d'arrivée)</div>
                  <div class="font-bold text-foreground">{{ d.result?.after?.lambda_rate || 0 }} patients/h</div>
                </div>
                <div class="bg-muted/30 rounded-lg p-3">
                  <div class="text-muted-foreground text-xs mb-1">µ (taux de service)</div>
                  <div class="font-bold text-foreground">{{ d.result?.after?.mu_rate || 0 }} patient/h</div>
                </div>
                <div class="bg-muted/30 rounded-lg p-3">
                  <div class="text-muted-foreground text-xs mb-1">ρ médecins (APRÈS)</div>
                  <div class="font-bold text-foreground">{{ ((d.result?.after?.rho_doctors || 0) * 100).toFixed(1) }}%</div>
                </div>
                <div class="bg-muted/30 rounded-lg p-3">
                  <div class="text-muted-foreground text-xs mb-1">ρ lits (APRÈS)</div>
                  <div class="font-bold text-foreground">{{ ((d.result?.after?.rho_beds || 0) * 100).toFixed(1) }}%</div>
                </div>
              </div>
            </div>

            <!-- Charge par Service -->
            <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-border">
                <h2 class="font-bold text-foreground flex items-center gap-2">
                  <lucide-icon name="stethoscope" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
                  Charge par Service
                </h2>
              </div>
              <table class="w-full">
                <thead>
                  <tr class="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                    <th class="text-left px-5 py-2">Service</th>
                    <th class="text-left px-5 py-2 w-1/2">Charge</th>
                    <th class="text-right px-5 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of serviceLoads()" class="border-t border-border">
                    <td class="px-5 py-3">
                      <span class="font-medium text-foreground">{{ s.name }}</span>
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-3">
                        <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div class="h-full rounded-full transition-all"
                               [style.width.%]="s.load"
                               [style.backgroundColor]="s.load >= 80 ? RED : s.load >= 60 ? ORANGE : GREEN">
                          </div>
                        </div>
                        <span class="text-sm font-bold w-12 text-right"
                              [style.color]="s.load >= 80 ? RED : s.load >= 60 ? ORANGE : GREEN">
                          {{ s.load }}%
                        </span>
                      </div>
                    </td>
                    <td class="px-5 py-3 text-right text-base">
                      {{ s.load < 60 ? '🟢' : s.load < 80 ? '🟡' : '🔴' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Équipements Critiques -->
            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h2 class="font-bold text-foreground flex items-center gap-2 mb-3">
                <lucide-icon name="wrench" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
                Équipements Critiques
              </h2>
              <div class="space-y-2">
                <div *ngFor="let e of equipmentStatus()"
                     class="flex items-center justify-between p-3 rounded-lg border"
                     [style.borderColor]="e.color + '30'"
                     [style.backgroundColor]="e.color + '08'">
                  <div class="flex items-center gap-3">
                    <lucide-icon name="package" class="w-4 h-4" [style.color]="e.color"></lucide-icon>
                    <div>
                      <div class="text-sm font-medium text-foreground">{{ e.name }}</div>
                      <div class="text-xs text-muted-foreground">Utilisation {{ e.usage }}%</div>
                    </div>
                  </div>
                  <span class="text-xs font-semibold px-2 py-1 rounded"
                        [style.backgroundColor]="e.color + '20'"
                        [style.color]="e.color">
                    {{ e.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- COMPARAISON AVANT vs APRÈS -->
            <div class="flex items-center gap-2 px-1 mt-2">
              <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
              <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">Comparaison AVANT vs APRÈS</h2>
            </div>
            <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                    <th class="text-left px-5 py-2.5">Indicateur</th>
                    <th class="text-right px-5 py-2.5">AVANT</th>
                    <th class="text-center px-5 py-2.5"></th>
                    <th class="text-right px-5 py-2.5">APRÈS</th>
                    <th class="text-right px-5 py-2.5">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of compareRows()" class="border-t border-border">
                    <td class="px-5 py-3 font-medium text-foreground">{{ row.label }}</td>
                    <td class="px-5 py-3 text-right text-muted-foreground">{{ row.before }}</td>
                    <td class="px-5 py-3 text-center text-muted-foreground">→</td>
                    <td class="px-5 py-3 text-right font-bold"
                        [style.color]="row.improved ? GREEN : RED">
                      {{ row.after }}
                    </td>
                    <td class="px-5 py-3 text-right text-xs font-bold"
                        [style.color]="row.improved ? GREEN : RED">
                      {{ row.delta > 0 ? '+' : '' }}{{ row.delta.toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Bouton retour -->
            <div class="pt-2">
              <a routerLink="/simulation"
                 class="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground inline-flex items-center gap-2 transition-colors">
                <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
                Modifier le scénario
              </a>
            </div>

          </div>
        </div>
      </div>
    </ng-container>

    <!-- Page vide si pas de simulation -->
    <ng-template #empty>
      <div class="flex flex-col h-full bg-background items-center justify-center p-6">
        <div class="bg-card rounded-2xl border border-border shadow-sm p-10 text-center max-w-md">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style="background: linear-gradient(135deg, #00BCD415, #0288D115);">
            <lucide-icon name="brain" class="w-8 h-8" [style.color]="PRIMARY"></lucide-icon>
          </div>
          <div class="font-bold text-foreground text-xl mb-1">Aucun résultat disponible</div>
          <div class="text-sm text-muted-foreground mb-5">
            Lancez d'abord une simulation depuis le centre de simulation.
          </div>
          <a routerLink="/simulation"
             class="px-5 py-2.5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all inline-block"
             style="background: linear-gradient(135deg, #00BCD4, #0288D1);">
            Aller au centre de simulation
          </a>
        </div>
      </div>
    </ng-template>
  `,
})
export class SimulationResultComponent implements OnInit {
  private store = inject(SimulationStoreService);

  GREEN = GREEN; ORANGE = ORANGE; RED = RED; PRIMARY = PRIMARY; PRIMARY_DARK = PRIMARY_DARK;

  data = signal<any>(null);

  ngOnInit() {
    this.data.set(this.store.get());
  }

  serviceLoads = computed(() => {
    const d = this.data();
    if (!d?.result?.after) return [];
    const after = d.result.after;
    return [
      { name: 'Utilisation médecins', load: Math.round((after.rho_doctors || 0) * 100) },
      { name: 'Occupation lits', load: Math.round(after.bed_occupancy_rate || 0) },
      { name: 'Couverture services', load: Math.round(after.service_coverage || 0) },
    ];
  });

  equipmentStatus = computed(() => {
    const d = this.data();
    if (!d?.result?.after) return [];
    const after = d.result.after;
    const util = after.resource_utilization || 0;
    return [
      {
        name: 'Ressources médicales',
        usage: Math.round(util),
        status: util > 90 ? 'Critique' : util > 70 ? 'Attention' : 'Optimal',
        color: util > 90 ? RED : util > 70 ? ORANGE : GREEN,
      },
      {
        name: 'Capacité lits',
        usage: Math.round(after.bed_occupancy_rate || 0),
        status: (after.bed_occupancy_rate || 0) > 85 ? 'Saturé' : 'Normal',
        color: (after.bed_occupancy_rate || 0) > 85 ? RED : GREEN,
      },
    ];
  });

  compareRows = computed(() => {
    const d = this.data();
    if (!d?.result?.before || !d?.result?.after) return [];
    const before = d.result.before;
    const after = d.result.after;
    const imp = d.result.improvements;
    return [
      {
        label: 'Temps d\'attente (min)',
        before: `${before.waiting_time_minutes} min`,
        after: `${after.waiting_time_minutes} min`,
        delta: imp.waiting_time || 0,
        improved: (imp.waiting_time || 0) >= 0,
      },
      {
        label: 'Occupation des lits',
        before: `${before.bed_occupancy_rate}%`,
        after: `${after.bed_occupancy_rate}%`,
        delta: imp.bed_occupancy || 0,
        improved: (imp.bed_occupancy || 0) >= 0,
      },
      {
        label: 'Débit patients/jour',
        before: `${before.throughput_patients}`,
        after: `${after.throughput_patients}`,
        delta: imp.throughput || 0,
        improved: (imp.throughput || 0) >= 0,
      },
      {
        label: 'Utilisation ressources',
        before: `${before.resource_utilization}%`,
        after: `${after.resource_utilization}%`,
        delta: imp.resource_utilization || 0,
        improved: (imp.resource_utilization || 0) >= 0,
      },
      {
        label: 'Couverture services',
        before: `${before.service_coverage}%`,
        after: `${after.service_coverage}%`,
        delta: imp.service_coverage || 0,
        improved: (imp.service_coverage || 0) >= 0,
      },
    ];
  });
}
