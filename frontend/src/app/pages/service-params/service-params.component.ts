// src/app/pages/service-params/service-params.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/auth.service';

const BASE = 'http://localhost:8000/api';
const PRIMARY = '#00BCD4';

@Component({
  selector: 'app-service-params',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background overflow-y-auto">

  <!-- HEADER -->
  <div class="px-6 py-5 border-b bg-card flex items-center gap-4">
    <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
         style="background:linear-gradient(135deg,#43A047,#2E7D32)">
      <lucide-icon name="sliders-horizontal" class="w-6 h-6 text-white"></lucide-icon>
    </div>
    <div>
      <h1 class="text-xl font-bold text-foreground">Paramètres du service</h1>
      <p class="text-sm text-muted-foreground">
        Saisissez les intervalles réels de votre service — données Dr. Kitouni, CHU Ibn Badis
      </p>
    </div>
    <div class="ml-auto">
      <span class="text-xs px-3 py-1.5 rounded-full font-semibold"
            style="background:#43A04715;color:#43A047">
        {{ auth.currentUser()?.service?.name ?? 'Mon service' }}
      </span>
    </div>
  </div>

  <!-- CONTENU -->
  <div class="flex-1 p-6 max-w-2xl mx-auto w-full space-y-5">

    <!-- Message succès/erreur -->
    <div *ngIf="msg()" class="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
         [style.background]="msgType()==='ok'?'#43A04715':'#E5393515'"
         [style.border]="'1px solid '+(msgType()==='ok'?'#43A04740':'#E5393540')"
         [style.color]="msgType()==='ok'?'#43A047':'#E53935'">
      <lucide-icon [name]="msgType()==='ok'?'check-circle':'alert-circle'" class="w-4 h-4"></lucide-icon>
      {{ msg() }}
    </div>

    <!-- Chargement -->
    <div *ngIf="loading()" class="text-center py-12 text-sm text-muted-foreground">
      <lucide-icon name="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2" style="color:#43A047"></lucide-icon>
      Chargement des paramètres...
    </div>

    <div *ngIf="!loading()" class="space-y-5">

      <!-- Explication -->
      <div class="rounded-2xl border p-4 text-sm"
           style="background:#00BCD408;border-color:#00BCD430;color:#0288D1">
        <div class="flex items-start gap-2">
          <lucide-icon name="info" class="w-4 h-4 mt-0.5 flex-shrink-0"></lucide-icon>
          <div>
            <div class="font-semibold mb-1">Ces paramètres influencent directement la simulation</div>
            <div class="text-xs opacity-80">
              La DMS simulée et le temps d'attente sont calculés à partir de ces intervalles.
              Chaque chef de service saisit ses propres valeurs observées dans son service.
            </div>
          </div>
        </div>
      </div>

      <!-- DMS -->
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-1 flex items-center gap-2">
          <lucide-icon name="calendar" class="w-4 h-4" style="color:#43A047"></lucide-icon>
          Durée Moyenne de Séjour (DMS)
        </h2>
        <p class="text-xs text-muted-foreground mb-4">
          Intervalle observé dans votre service — données collectées sur le terrain.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">
              Durée minimale (jours)
            </label>
            <input [(ngModel)]="params.dms_min_jours"
                   type="number" min="1" max="59" step="0.5"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"
                   [style.borderColor]="params.dms_min_jours >= params.dms_max_jours ? '#E53935' : ''"/>
            <p class="text-[10px] text-muted-foreground mt-1">Min : 1 jour</p>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">
              Durée maximale (jours)
            </label>
            <input [(ngModel)]="params.dms_max_jours"
                   type="number" min="2" max="60" step="0.5"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"
                   [style.borderColor]="params.dms_min_jours >= params.dms_max_jours ? '#E53935' : ''"/>
            <p class="text-[10px] text-muted-foreground mt-1">Max : 60 jours (2 mois)</p>
          </div>
        </div>

        <!-- Validation DMS -->
        <div *ngIf="params.dms_min_jours >= params.dms_max_jours"
             class="mt-2 text-xs font-semibold" style="color:#E53935">
          ⚠ La DMS minimale doit être inférieure à la maximale.
        </div>

        <!-- Aperçu -->
        <div class="mt-4 p-3 rounded-xl text-xs" style="background:#43A04710">
          <div class="font-semibold mb-1" style="color:#43A047">Aperçu</div>
          <div class="text-muted-foreground">
            DMS terrain : entre <b class="text-foreground">{{ params.dms_min_jours }} jour(s)</b>
            et <b class="text-foreground">{{ params.dms_max_jours }} jours</b>
            — Moyenne utilisée en simulation :
            <b class="text-foreground">{{ ((params.dms_min_jours + params.dms_max_jours) / 2).toFixed(1) }} jours</b>
          </div>
        </div>
      </div>

      <!-- Durée de consultation -->
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-1 flex items-center gap-2">
          <lucide-icon name="clock" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Durée de Consultation
        </h2>
        <p class="text-xs text-muted-foreground mb-4">
          Intervalle de durée de consultation observé dans votre service.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">
              Durée minimale (minutes)
            </label>
            <input [(ngModel)]="params.consultation_min_min"
                   type="number" min="1" max="59" step="1"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"
                   [style.borderColor]="params.consultation_min_min >= params.consultation_max_min ? '#E53935' : ''"/>
            <p class="text-[10px] text-muted-foreground mt-1">Min : 1 minute</p>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">
              Durée maximale (minutes)
            </label>
            <input [(ngModel)]="params.consultation_max_min"
                   type="number" min="2" max="60" step="1"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"
                   [style.borderColor]="params.consultation_min_min >= params.consultation_max_min ? '#E53935' : ''"/>
            <p class="text-[10px] text-muted-foreground mt-1">Max : 60 minutes</p>
          </div>
        </div>

        <!-- Validation consultation -->
        <div *ngIf="params.consultation_min_min >= params.consultation_max_min"
             class="mt-2 text-xs font-semibold" style="color:#E53935">
          ⚠ La durée minimale doit être inférieure à la maximale.
        </div>

        <!-- Aperçu -->
        <div class="mt-4 p-3 rounded-xl text-xs" style="background:#00BCD410">
          <div class="font-semibold mb-1" style="color:#00BCD4">Aperçu</div>
          <div class="text-muted-foreground">
            Consultation : entre <b class="text-foreground">{{ params.consultation_min_min }} min</b>
            et <b class="text-foreground">{{ params.consultation_max_min }} min</b>
            — Moyenne utilisée (μ) :
            <b class="text-foreground">{{ ((params.consultation_min_min + params.consultation_max_min) / 2).toFixed(0) }} min</b>
          </div>
        </div>
      </div>

      <!-- Bouton enregistrer -->
      <button type="button" (click)="save()"
              [disabled]="saving() || params.dms_min_jours >= params.dms_max_jours || params.consultation_min_min >= params.consultation_max_min"
              class="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
              style="background:linear-gradient(135deg,#43A047,#2E7D32)">
        <lucide-icon [name]="saving()?'loader-2':'check-circle'" class="w-5 h-5" [class.animate-spin]="saving()"></lucide-icon>
        {{ saving() ? 'Enregistrement...' : 'Enregistrer les paramètres' }}
      </button>

    </div>
  </div>
</div>
  `,
})
export class ServiceParamsComponent implements OnInit {
  auth    = inject(AuthService);
  private http = inject(HttpClient);

  loading = signal(true);
  saving  = signal(false);
  msg     = signal<string|null>(null);
  msgType = signal<'ok'|'err'>('ok');

  params = {
    dms_min_jours:        1,
    dms_max_jours:        60,
    consultation_min_min: 10,
    consultation_max_min: 30,
  };

  ngOnInit() {
    const serviceId = this.auth.currentUser()?.service_id;
    if (!serviceId) { this.loading.set(false); return; }

    this.http.get<any>(`${BASE}/services/${serviceId}/params`).subscribe({
      next: data => {
        this.params = {
          dms_min_jours:        data.dms_min_jours        ?? 1,
          dms_max_jours:        data.dms_max_jours        ?? 60,
          consultation_min_min: data.consultation_min_min ?? 10,
          consultation_max_min: data.consultation_max_min ?? 30,
        };
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  showMsg(text: string, type: 'ok'|'err' = 'ok') {
    this.msg.set(text);
    this.msgType.set(type);
    setTimeout(() => this.msg.set(null), 4000);
  }

  save() {
    const serviceId = this.auth.currentUser()?.service_id;
    if (!serviceId) { this.showMsg('Service introuvable.', 'err'); return; }
    if (this.params.dms_min_jours >= this.params.dms_max_jours) {
      this.showMsg('La DMS minimale doit être inférieure à la maximale.', 'err'); return;
    }
    if (this.params.consultation_min_min >= this.params.consultation_max_min) {
      this.showMsg('La durée de consultation minimale doit être inférieure à la maximale.', 'err'); return;
    }

    this.saving.set(true);
    this.http.put<any>(`${BASE}/services/${serviceId}/params`, this.params).subscribe({
      next: () => {
        this.saving.set(false);
        this.showMsg('Paramètres enregistrés avec succès !');
      },
      error: err => {
        this.saving.set(false);
        this.showMsg(err.error?.message || 'Erreur lors de l\'enregistrement.', 'err');
      }
    });
  }
}