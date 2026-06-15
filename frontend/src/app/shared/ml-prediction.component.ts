import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from './api.service';
import { Service } from './models';

const FLASK = 'http://localhost:5000';

@Component({
  selector: 'app-ml-prediction',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
<div class="bg-card rounded-2xl border shadow-sm overflow-hidden">

  <!-- HEADER -->
  <div class="px-5 py-4 border-b flex items-center justify-between"
       style="background:linear-gradient(135deg,#7C3AED10,#9333EA10)">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
           style="background:linear-gradient(135deg,#7C3AED,#9333EA)">
        <lucide-icon name="brain" class="w-5 h-5 text-white"></lucide-icon>
      </div>
      <div>
        <div class="text-sm font-bold text-foreground">Diagnostic ML — Qualité Hospitalière</div>
        <div class="text-[10px] text-muted-foreground">
          XGBoost · Dataset NHS · F1-Macro 94.2% · {{ services.length }} service(s) analysé(s)
        </div>
      </div>
    </div>
    <button (click)="runPrediction()"
            [disabled]="loading()"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60 flex-shrink-0"
            style="background:linear-gradient(135deg,#7C3AED,#9333EA)">
      <lucide-icon [name]="loading() ? 'loader-2' : 'zap'" class="w-3.5 h-3.5"
                   [class.animate-spin]="loading()"></lucide-icon>
      {{ loading() ? 'Analyse ML…' : 'Lancer le diagnostic' }}
    </button>
  </div>

  <!-- ERREUR -->
  <div *ngIf="error()" class="px-5 py-3 text-xs text-red-600 flex items-center gap-2"
       style="background:#E5393508">
    <lucide-icon name="alert-circle" class="w-4 h-4 flex-shrink-0"></lucide-icon>
    {{ error() }}
  </div>

  <!-- PAS ENCORE LANCÉ -->
  <div *ngIf="!loading() && !results().length && !error()"
       class="px-5 py-6 text-center text-sm text-muted-foreground">
    <lucide-icon name="brain" class="w-8 h-8 mx-auto mb-2 opacity-20"></lucide-icon>
    <div>Cliquez sur <b>"Lancer le diagnostic"</b> pour analyser chaque service via le modèle ML.</div>
    <div class="text-[10px] mt-1 text-muted-foreground">Le modèle analyse 17 indicateurs par service et prédit : Critique / Attention / Normal</div>
  </div>

  <!-- RÉSULTATS -->
  <div *ngIf="results().length" class="p-5 space-y-4">

    <!-- Verdict global hôpital -->
    <div class="rounded-2xl border p-4 flex items-center gap-4"
         [style.borderColor]="globalColor()+'40'"
         [style.backgroundColor]="globalColor()+'08'">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
           [style.backgroundColor]="globalColor()+'18'">
        {{ globalEmoji() }}
      </div>
      <div class="flex-1">
        <div class="font-bold text-foreground text-sm">Verdict global — CHU Ibn Badis</div>
        <div class="text-xs font-bold mt-0.5" [style.color]="globalColor()">
          {{ globalLabel() }}
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-2xl font-bold" [style.color]="globalColor()">
          {{ (globalConfidence() * 100) | number:'1.0-0' }}%
        </div>
        <div class="text-[10px] text-muted-foreground">confiance moy.</div>
      </div>
    </div>

    <!-- Résultats par service -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div *ngFor="let r of results()"
           class="rounded-xl border p-4 space-y-2.5"
           [style.borderColor]="labelColor(r.prediction.label)+'40'"
           [style.backgroundColor]="labelColor(r.prediction.label)+'06'">

        <!-- Nom + statut -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full flex-shrink-0"
                 [style.backgroundColor]="labelColor(r.prediction.label)"></div>
            <span class="text-sm font-bold text-foreground">{{ r.service_name }}</span>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                [style.backgroundColor]="labelColor(r.prediction.label)+'20'"
                [style.color]="labelColor(r.prediction.label)">
            {{ r.prediction.recommandation.niveau }}
          </span>
        </div>

        <!-- Barres probabilités -->
        <div class="space-y-1">
          <div *ngFor="let cls of ['Normal','Attention','Critique']"
               class="flex items-center gap-2">
            <span class="text-[9px] text-muted-foreground w-14 flex-shrink-0">{{ cls }}</span>
            <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                   [style.backgroundColor]="labelColor(cls)"
                   [style.width.%]="(r.prediction.probabilites[cls] || 0) * 100"></div>
            </div>
            <span class="text-[9px] font-bold w-8 text-right"
                  [style.color]="labelColor(cls)">
              {{ ((r.prediction.probabilites[cls] || 0) * 100) | number:'1.0-0' }}%
            </span>
          </div>
        </div>

        <!-- Recommandation -->
        <div class="rounded-lg px-3 py-2 text-[10px]"
             [style.backgroundColor]="labelColor(r.prediction.label)+'12'">
          <div class="font-bold" [style.color]="labelColor(r.prediction.label)">
            {{ r.prediction.recommandation.action }}
          </div>
          <div class="text-muted-foreground mt-0.5">
            {{ r.prediction.recommandation.details }}
          </div>
        </div>
      </div>
    </div>

    <!-- Note -->
    <div class="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
      <lucide-icon name="info" class="w-3 h-3"></lucide-icon>
      Modèle entraîné sur dataset NHS (12 années fiscales · ~1236 entrées) · Standards UK appliqués
    </div>
  </div>
</div>
  `,
})
export class MlPredictionComponent implements OnInit {
  @Input() services: Service[] = [];

  private http = inject(HttpClient);
  private api  = inject(ApiService);

  loading = signal(false);
  error   = signal('');
  results = signal<any[]>([]);

  // Cache des KPIs par service
  private kpisCache: Record<number, any> = {};

  ngOnInit() {}

  // ── Mapping KPIs HealthSim → features ML ─────────────────
  private buildMlFeatures(svc: Service, kpis: any): any {
    const beds    = Math.max(1, svc.beds    || 1);
    const docs    = Math.max(1, svc.doctors || 1);
    const nurses  = svc.nurses   || 0;
    const patients= svc.patients || 0;

    const SSI = kpis?.SSI || {};
    const IIP = kpis?.IIP || {};
    const svcAny = svc as any;

    return {
      taux_mortalite              : IIP.C3_mortalite ?? 1.5,
      taux_occupation_lits        : Math.min((IIP.C2_occupation ?? (patients/beds*100)) / 100, 1),
      taux_infection_nosocomiale  : (IIP.C4_infection ?? 3.5) / 100,
      duree_moyenne_sejour_jours  : SSI.A2_dms ?? 4,
      temps_attente_median_min    : SSI.A4_temps_attente ?? 0,
      taux_transfert              : (SSI.A9_taux_transfert ?? 13) / 100,
      nombre_lits_disponibles     : Math.max(0, beds - patients),
      total_admissions            : Math.round((svcAny.lambda_patients_jour ?? 50) * 365),
      nombre_medecins             : docs,
      nombre_infirmiers           : nurses,
      ratio_medecin_par_lit       : Math.round(docs   / beds * 1000) / 1000,
      ratio_infirmier_par_lit     : Math.round(nurses / beds * 1000) / 1000,
      ratio_infirmier_par_medecin : Math.round(nurses / docs * 1000) / 1000,
      annee                       : new Date().getFullYear(),
    };
  }

  runPrediction() {
    if (!this.services.length) {
      this.error.set('Aucun service disponible.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.results.set([]);

    // Charger les KPIs de tous les services puis appeler /predict
    let loaded = 0;
    const total = this.services.length;

    this.services.forEach(svc => {
      this.api.getServiceKpis(svc.id).subscribe({
        next: (data: any) => {
          this.kpisCache[svc.id] = data.kpis ?? {};
          loaded++;
          if (loaded === total) this.callPredict();
        },
        error: () => {
          this.kpisCache[svc.id] = {};
          loaded++;
          if (loaded === total) this.callPredict();
        }
      });
    });
  }

  private callPredict() {
    const payload = {
      services: this.services.map(svc => ({
        service_name: svc.name,
        kpis        : this.buildMlFeatures(svc, this.kpisCache[svc.id] || {}),
      }))
    };

    this.http.post<any>(`${FLASK}/predict`, payload).subscribe({
      next: (res) => {
        this.results.set(res.results || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de contacter le modèle ML (port 5000). Vérifiez que Flask tourne.');
        this.loading.set(false);
      }
    });
  }

  labelColor(label: string): string {
    if (label === 'Critique') return '#E53935';
    if (label === 'Attention') return '#FB8C00';
    return '#43A047';
  }

  globalLabel(): string {
    const hasCrit = this.results().some(r => r.prediction?.label === 'Critique');
    const hasAtt  = this.results().some(r => r.prediction?.label === 'Attention');
    if (hasCrit) return '🔴 Intervention immédiate requise sur au moins un service';
    if (hasAtt)  return '🟡 Surveillance renforcée recommandée';
    return '🟢 Tous les services en situation normale';
  }

  globalColor(): string {
    const hasCrit = this.results().some(r => r.prediction?.label === 'Critique');
    const hasAtt  = this.results().some(r => r.prediction?.label === 'Attention');
    if (hasCrit) return '#E53935';
    if (hasAtt)  return '#FB8C00';
    return '#43A047';
  }

  globalEmoji(): string {
    const hasCrit = this.results().some(r => r.prediction?.label === 'Critique');
    const hasAtt  = this.results().some(r => r.prediction?.label === 'Attention');
    if (hasCrit) return '🔴';
    if (hasAtt)  return '🟡';
    return '🟢';
  }

  globalConfidence(): number {
    if (!this.results().length) return 0;
    return this.results().reduce((s, r) => s + (r.prediction?.confiance || 0), 0) / this.results().length;
  }
}