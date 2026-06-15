import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { Service } from '../../shared/models';

const PRIMARY = '#00BCD4'; const PRIMARY_DARK = '#0288D1';
const GREEN = '#43A047'; const ORANGE = '#FB8C00'; const RED = '#E53935';

type Category = 'SSI' | 'IIP' | 'ESI' | 'TI';

@Component({
  selector: 'app-service-kpi-category',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background">

  <!-- HEADER -->
  <div class="px-6 py-4 bg-card border-b flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <button (click)="back()" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
        <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
      </button>
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" [style.background]="catGradient()">
        <lucide-icon [name]="catIcon()" class="w-5 h-5 text-white"></lucide-icon>
      </div>
      <div>
        <h1 class="text-lg font-bold text-foreground">{{ catLabel() }}</h1>
        <p class="text-xs text-muted-foreground">{{ service()?.name }} · <span class="font-semibold" [style.color]="catMainColor()">{{ category }}</span></p>
      </div>
    </div>
    <span class="text-xs px-3 py-1.5 rounded-xl font-semibold" [style.backgroundColor]="catMainColor()+'18'" [style.color]="catMainColor()">
      {{ catTagline() }}
    </span>
  </div>

  <div class="flex-1 overflow-y-auto p-5">
  <div *ngIf="loading() || !kpisLoaded()" class="flex items-center justify-center h-40 text-sm text-muted-foreground">
    <div class="flex items-center gap-2"><lucide-icon name="loader-2" class="w-4 h-4 animate-spin" style="color:#00BCD4"></lucide-icon>Chargement…</div>
  </div>

  <div *ngIf="!loading() && kpisLoaded() && service() as svc" class="max-w-4xl mx-auto space-y-5">

    <!-- LÉGENDE STATUT -->
    <div class="flex items-center gap-4 px-1">
      <span class="text-[10px] text-muted-foreground font-semibold uppercase">Statut :</span>
      <span class="flex items-center gap-1.5 text-[10px] font-semibold" [style.color]="GREEN"><span class="w-2 h-2 rounded-full" [style.backgroundColor]="GREEN"></span>Dans la norme</span>
      <span class="flex items-center gap-1.5 text-[10px] font-semibold" [style.color]="ORANGE"><span class="w-2 h-2 rounded-full" [style.backgroundColor]="ORANGE"></span>Attention</span>
      <span class="flex items-center gap-1.5 text-[10px] font-semibold" [style.color]="RED"><span class="w-2 h-2 rounded-full" [style.backgroundColor]="RED"></span>Critique</span>
    </div>

    <!-- ══════════ SSI KPIs ══════════ -->
    <div *ngIf="category==='SSI'" class="grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- A2 DMS -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#00BCD4"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#00BCD420">
                <lucide-icon name="clock" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">A2 — Durée Moy. de Séjour</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'A2_dms','SSI'),true,4.5,7)+'18'"
                  [style.color]="kpiColor(kpi(svc,'A2_dms','SSI'),true,4.5,7)">
              {{ kpiStatus(kpi(svc,'A2_dms','SSI'),true,4.5,7) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'A2_dms','SSI'),true,4.5,7)">
              {{ kpi(svc,'A2_dms','SSI') | number:'1.0-1' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">jours</span>
          </div>
          <div class="h-2 rounded-full bg-muted overflow-hidden">
            <div class="h-full rounded-full" [style.backgroundColor]="kpiColor(kpi(svc,'A2_dms','SSI'),true,4.5,7)"
                 [style.width.%]="Math.min(kpi(svc,'A2_dms','SSI')/14*100,100)"></div>
          </div>
        </div>
      </div>

      <!-- A4 Temps attente GAUGE -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#00BCD4"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#00BCD420">
                <lucide-icon name="clock" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">A4 — Temps d'Attente</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'A4_temps_attente','SSI'),true,20,40)+'18'"
                  [style.color]="kpiColor(kpi(svc,'A4_temps_attente','SSI'),true,20,40)">
              {{ kpiStatus(kpi(svc,'A4_temps_attente','SSI'),true,20,40) }}
            </span>
          </div>
          <div class="flex justify-center my-3">
            <div class="relative" style="width:160px;height:90px">
              <svg viewBox="0 0 160 90" class="w-full h-full">
                <path d="M 12 82 A 68 68 0 0 1 148 82" fill="none" stroke="#e2e8f0" stroke-width="12" stroke-linecap="round"/>
                <path d="M 12 82 A 68 68 0 0 1 148 82" fill="none"
                      [attr.stroke]="kpiColor(kpi(svc,'A4_temps_attente','SSI'),true,20,40)"
                      stroke-width="12" stroke-linecap="round"
                      stroke-dasharray="213"
                      [attr.stroke-dashoffset]="213-(213*Math.min(kpi(svc,'A4_temps_attente','SSI'),60)/60)"/>
                <text x="80" y="68" text-anchor="middle" font-size="22" font-weight="700"
                      [attr.fill]="kpiColor(kpi(svc,'A4_temps_attente','SSI'),true,20,40)">
                  {{ kpi(svc,'A4_temps_attente','SSI') | number:'1.0-0' }}
                </text>
                <text x="80" y="80" text-anchor="middle" font-size="9" fill="#90A4AE">minutes</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- A8 Lits vacants DONUT -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#00BCD4"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#00BCD420">
                <lucide-icon name="bed" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">A8 — Taux de Lits Vacants</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)+'18'"
                  [style.color]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)">
              {{ kpiStatus(kpi(svc,'A8_lits_vacants','SSI'),false,15,8) }}
            </span>
          </div>
          <div class="flex items-center gap-6 my-3">
            <div class="relative flex-shrink-0" style="width:100px;height:100px">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" stroke-width="12"/>
                <circle cx="50" cy="50" r="38" fill="none"
                        [attr.stroke]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)"
                        stroke-width="12" stroke-linecap="round"
                        stroke-dasharray="239"
                        [attr.stroke-dashoffset]="239-(239*kpi(svc,'A8_lits_vacants','SSI')/100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold" [style.color]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)">
                  {{ kpi(svc,'A8_lits_vacants','SSI') | number:'1.0-0' }}%
                </span>
                <span class="text-[9px] text-muted-foreground">vacants</span>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-sm" [style.backgroundColor]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)"></span>Vacants
                </span>
                <b [style.color]="kpiColor(kpi(svc,'A8_lits_vacants','SSI'),false,15,8)">
                  {{ kpi(svc,'A8_lits_vacants','SSI') | number:'1.0-0' }}%
                </b>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-gray-300"></span>Occupés</span>
                <b class="text-muted-foreground">{{ 100-kpi(svc,'A8_lits_vacants','SSI') | number:'1.0-0' }}%</b>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Lits totaux</span>
                <b class="text-foreground">{{ svc.beds }}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- A9 Transferts -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#00BCD4"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#00BCD420">
                <lucide-icon name="arrow-right" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">A9 — Taux de Transfert</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'A9_taux_transfert','SSI'),true,2,5)+'18'"
                  [style.color]="kpiColor(kpi(svc,'A9_taux_transfert','SSI'),true,2,5)">
              {{ kpiStatus(kpi(svc,'A9_taux_transfert','SSI'),true,2,5) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'A9_taux_transfert','SSI'),true,2,5)">
              {{ kpi(svc,'A9_taux_transfert','SSI') | number:'1.0-1' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">%</span>
          </div>
          <div class="relative h-4 rounded-full overflow-hidden bg-muted">
            <div class="absolute h-full rounded-full"
                 [style.width.%]="Math.min(kpi(svc,'A9_taux_transfert','SSI')/15*100,100)"
                 [style.backgroundColor]="kpiColor(kpi(svc,'A9_taux_transfert','SSI'),true,2,5)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ IIP KPIs ══════════ -->
    <div *ngIf="category==='IIP'" class="grid grid-cols-1 md:grid-cols-3 gap-5">

      <!-- C2 Occupation DONUT -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#E53935"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E5393520">
                <lucide-icon name="bed" class="w-4 h-4" style="color:#E53935"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">C2 — Taux d'Occupation</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'C2_occupation','IIP'),true,85,92)+'18'"
                  [style.color]="kpiColor(kpi(svc,'C2_occupation','IIP'),true,85,92)">
              {{ kpiStatus(kpi(svc,'C2_occupation','IIP'),true,85,92) }}
            </span>
          </div>
          <div class="flex justify-center my-3">
            <div class="relative" style="width:110px;height:110px">
              <svg viewBox="0 0 110 110" class="w-full h-full -rotate-90">
                <circle cx="55" cy="55" r="44" fill="none" stroke="#e2e8f0" stroke-width="13"/>
                <circle cx="55" cy="55" r="44" fill="none"
                        [attr.stroke]="kpiColor(kpi(svc,'C2_occupation','IIP'),true,85,92)"
                        stroke-width="13" stroke-linecap="round"
                        stroke-dasharray="276"
                        [attr.stroke-dashoffset]="276-(276*kpi(svc,'C2_occupation','IIP')/100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold" [style.color]="kpiColor(kpi(svc,'C2_occupation','IIP'),true,85,92)">
                  {{ kpi(svc,'C2_occupation','IIP') | number:'1.0-0' }}%
                </span>
                <span class="text-[9px] text-muted-foreground">occupation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- C3 Mortalité -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#E53935"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E5393520">
                <lucide-icon name="heart" class="w-4 h-4" style="color:#E53935"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">C3 — Taux de Mortalité</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'C3_mortalite','IIP'),true,2,4)+'18'"
                  [style.color]="kpiColor(kpi(svc,'C3_mortalite','IIP'),true,2,4)">
              {{ kpiStatus(kpi(svc,'C3_mortalite','IIP'),true,2,4) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'C3_mortalite','IIP'),true,2,4)">
              {{ kpi(svc,'C3_mortalite','IIP') | number:'1.0-2' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">%</span>
          </div>
          <div class="relative h-3 rounded-full bg-muted">
            <div class="absolute h-full rounded-full w-1/3" style="background:linear-gradient(90deg,#43A047,#FB8C00)"></div>
            <div class="absolute h-full rounded-full w-1/3" style="left:33%;background:linear-gradient(90deg,#FB8C00,#E53935)"></div>
            <div class="absolute h-full rounded-full w-1/3" style="left:66%;background:#E53935"></div>
            <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-md"
                 [style.left.%]="Math.min(kpi(svc,'C3_mortalite','IIP')/6*100,100)"
                 style="top:-2px;transform:translateX(-50%)"
                 [style.backgroundColor]="kpiColor(kpi(svc,'C3_mortalite','IIP'),true,2,4)"></div>
          </div>
        </div>
      </div>

      <!-- C4 Infections -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#E53935"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E5393520">
                <lucide-icon name="alert-circle" class="w-4 h-4" style="color:#E53935"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">C4 — Infections Nosocomiales</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'C4_infection','IIP'),true,1,3)+'18'"
                  [style.color]="kpiColor(kpi(svc,'C4_infection','IIP'),true,1,3)">
              {{ kpiStatus(kpi(svc,'C4_infection','IIP'),true,1,3) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'C4_infection','IIP'),true,1,3)">
              {{ kpi(svc,'C4_infection','IIP') | number:'1.0-2' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">%</span>
          </div>
          <div class="relative h-4 rounded-full overflow-hidden bg-muted">
            <div class="absolute h-full rounded-full"
                 [style.width.%]="Math.min(kpi(svc,'C4_infection','IIP')/6*100,100)"
                 [style.backgroundColor]="kpiColor(kpi(svc,'C4_infection','IIP'),true,1,3)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ ESI KPIs ══════════ -->
    <div *ngIf="category==='ESI'" class="grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- B1 -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#43A047"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#43A04720">
              <lucide-icon name="trending-up" class="w-4 h-4" style="color:#43A047"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">B1 — Coût Moyen des Soins</span>
          </div>
          <div class="text-center my-4">
            <span class="text-4xl font-bold" style="color:#43A047">{{ formatDA(kpi(svc,'B1_cout_soins','ESI')) }}</span>
            <span class="text-sm text-muted-foreground ml-2">DA / patient</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#00BCD4"></span><span class="flex-1 text-muted-foreground">Personnel</span><div class="w-28 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" style="width:40%;background:#00BCD4"></div></div><span class="w-8 text-right text-muted-foreground font-semibold">40%</span></div>
            <div class="flex items-center gap-2 text-xs"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#43A047"></span><span class="flex-1 text-muted-foreground">Médicaments</span><div class="w-28 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" style="width:25%;background:#43A047"></div></div><span class="w-8 text-right text-muted-foreground font-semibold">25%</span></div>
            <div class="flex items-center gap-2 text-xs"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#FB8C00"></span><span class="flex-1 text-muted-foreground">Équipements</span><div class="w-28 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" style="width:20%;background:#FB8C00"></div></div><span class="w-8 text-right text-muted-foreground font-semibold">20%</span></div>
          </div>
        </div>
      </div>

      <!-- B4 -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#43A047"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#43A04720">
              <lucide-icon name="bed" class="w-4 h-4" style="color:#43A047"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">B4 — Coût par Lit / Jour</span>
          </div>
          <div class="text-center my-4">
            <span class="text-4xl font-bold" style="color:#43A047">{{ formatDA(kpi(svc,'B4_cout_lit','ESI')) }}</span>
            <span class="text-sm text-muted-foreground ml-2">DA / lit / jour</span>
          </div>
        </div>
      </div>

      <!-- B5 -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#43A047"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#43A04720">
              <lucide-icon name="activity" class="w-4 h-4" style="color:#43A047"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">B5 — Médicaments & Équipements</span>
          </div>
          <div class="text-center my-4">
            <span class="text-4xl font-bold" style="color:#43A047">{{ formatM(kpi(svc,'B5_cout_med_eq','ESI')) }}</span>
            <span class="text-sm text-muted-foreground ml-2">MDA / mois</span>
          </div>
        </div>
      </div>

      <!-- B7 -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#43A047"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#43A04720">
              <lucide-icon name="users" class="w-4 h-4" style="color:#43A047"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">B7 — Coût du Personnel</span>
          </div>
          <div class="text-center my-4">
            <span class="text-4xl font-bold" style="color:#43A047">{{ formatM(kpi(svc,'B7_cout_personnel','ESI')) }}</span>
            <span class="text-sm text-muted-foreground ml-2">MDA / mois</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#00BCD4"></span><span class="flex-1 text-muted-foreground">Médecins ({{ svc.doctors }})</span><div class="w-28 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" style="width:45%;background:#00BCD4"></div></div><span class="w-8 text-right font-semibold text-muted-foreground">45%</span></div>
            <div class="flex items-center gap-2 text-xs"><span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:#43A047"></span><span class="flex-1 text-muted-foreground">Infirmiers ({{ svc.nurses }})</span><div class="w-28 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" style="width:30%;background:#43A047"></div></div><span class="w-8 text-right font-semibold text-muted-foreground">30%</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ TI KPIs ══════════ -->
    <div *ngIf="category==='TI'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

      <!-- D5 -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#FB8C00"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
              <lucide-icon name="stethoscope" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">D5 — Équipements Médicaux</span>
          </div>
          <div class="flex justify-center my-2">
            <div class="relative" style="width:90px;height:90px">
              <svg viewBox="0 0 90 90" class="w-full h-full -rotate-90">
                <circle cx="45" cy="45" r="35" fill="none" stroke="#e2e8f0" stroke-width="11"/>
                <circle cx="45" cy="45" r="35" fill="none"
                        [attr.stroke]="kpiColor(kpi(svc,'D5_distribution_eq','TI'),false,90,70)"
                        stroke-width="11" stroke-linecap="round"
                        stroke-dasharray="220"
                        [attr.stroke-dashoffset]="220-(220*kpi(svc,'D5_distribution_eq','TI')/100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold" [style.color]="kpiColor(kpi(svc,'D5_distribution_eq','TI'),false,90,70)">
                  {{ kpi(svc,'D5_distribution_eq','TI') | number:'1.0-0' }}
                </span>
                <span class="text-[8px] text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- D11 DASRI -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#FB8C00"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
              <lucide-icon name="trash-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">D11 — Gestion DASRI</span>
          </div>
          <div class="flex justify-center my-2">
            <div class="relative" style="width:150px;height:82px">
              <svg viewBox="0 0 150 82" class="w-full h-full">
                <path d="M 12 77 A 63 63 0 0 1 138 77" fill="none" stroke="#e2e8f0" stroke-width="11" stroke-linecap="round"/>
                <path d="M 12 77 A 63 63 0 0 1 138 77" fill="none"
                      [attr.stroke]="kpiColor(kpi(svc,'D11_gestion_dechets','TI'),false,80,60)"
                      stroke-width="11" stroke-linecap="round"
                      stroke-dasharray="198"
                      [attr.stroke-dashoffset]="198-(198*kpi(svc,'D11_gestion_dechets','TI')/100)"/>
                <text x="75" y="68" text-anchor="middle" font-size="20" font-weight="700"
                      [attr.fill]="kpiColor(kpi(svc,'D11_gestion_dechets','TI'),false,80,60)">
                  {{ kpi(svc,'D11_gestion_dechets','TI') | number:'1.0-0' }}
                </text>
                <text x="75" y="79" text-anchor="middle" font-size="8" fill="#90A4AE">/100</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- D12 Localisation -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#FB8C00"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
              <lucide-icon name="activity" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
            </div>
            <span class="text-sm font-bold text-foreground">D12 — Accessibilité</span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'D12_localisation','TI'),false,75,50)">
              {{ kpi(svc,'D12_localisation','TI') | number:'1.0-0' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">/100</span>
          </div>
        </div>
      </div>

      <!-- D13 Air -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#FB8C00"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
                <lucide-icon name="activity" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">D13 — Qualité Air Intérieur</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'D13_air_interieur','TI'),false,75,50)+'18'"
                  [style.color]="kpiColor(kpi(svc,'D13_air_interieur','TI'),false,75,50)">
              {{ kpiStatus(kpi(svc,'D13_air_interieur','TI'),false,75,50) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'D13_air_interieur','TI'),false,75,50)">
              {{ kpi(svc,'D13_air_interieur','TI') | number:'1.0-0' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">/100</span>
          </div>
        </div>
      </div>

      <!-- D14 Acoustique -->
      <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div class="h-1" style="background:#FB8C00"></div>
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
                <lucide-icon name="volume-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
              </div>
              <span class="text-sm font-bold text-foreground">D14 — Isolation Acoustique</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="kpiColor(kpi(svc,'D14_acoustique','TI'),false,70,50)+'18'"
                  [style.color]="kpiColor(kpi(svc,'D14_acoustique','TI'),false,70,50)">
              {{ kpiStatus(kpi(svc,'D14_acoustique','TI'),false,70,50) }}
            </span>
          </div>
          <div class="text-center my-4">
            <span class="text-5xl font-bold" [style.color]="kpiColor(kpi(svc,'D14_acoustique','TI'),false,70,50)">
              {{ kpi(svc,'D14_acoustique','TI') | number:'1.0-0' }}
            </span>
            <span class="text-lg text-muted-foreground ml-2">/100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOUTON SIMULER CE SERVICE -->
    <div class="rounded-2xl border p-5 flex items-center justify-between gap-4"
         [style.borderColor]="catMainColor()+'40'" [style.background]="catMainColor()+'06'">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <lucide-icon name="zap" class="w-4 h-4" [style.color]="catMainColor()"></lucide-icon>
          <span class="text-sm font-bold text-foreground">Simuler mon service</span>
        </div>
        <div class="text-xs text-muted-foreground">Testez vos décisions sur les données de <b>{{ service()?.name }}</b></div>
      </div>
      <button (click)="goSim()" class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md flex-shrink-0"
              style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>Simuler ce service
      </button>
    </div>

  </div>
  </div>
</div>
  `,
})
export class ServiceKpiCategoryComponent implements OnInit {
  private api    = inject(ApiService);
  private http   = inject(HttpClient);          // ✅ AJOUT HttpClient
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  readonly Math = Math;
  readonly GREEN = GREEN; readonly ORANGE = ORANGE; readonly RED = RED;

  hospitalId  = 0;
  svcId       = 0;
  category    = '' as Category;
  service     = signal<Service | null>(null);
  loading     = signal(true);
  kpisLoaded  = signal(false);

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id')    ?? '0', 10);
    this.svcId      = parseInt(this.route.snapshot.paramMap.get('svcId') ?? '0', 10);
    this.category   = (this.route.snapshot.paramMap.get('category') ?? 'SSI') as Category;

    this.api.getServiceKpis(this.svcId).subscribe({
      next: (kpiData: any) => {
        const meta = kpiData.meta ?? {};
        const kpis = kpiData.kpis ?? {};

        const svc: any = {
          id:            this.svcId,
          name:          kpiData.serviceName ?? '',
          status:        kpiData.status ?? 'normal',
          doctors:       meta.doctors  ?? 0,
          nurses:        meta.nurses   ?? 0,
          beds:          meta.beds     ?? 0,
          patients:      meta.patients ?? 0,
          availableBeds: (meta.beds ?? 0) - (meta.patients ?? 0),
          kpis,
          equipment: [],
          // Champs pour Flask
          dms_heures:           kpiData.dms_heures           || meta.dms_heures           || 96,
          mortalite_base:       kpiData.mortalite_base       || meta.mortalite_base        || 1.5,
          lambda_patients_jour: kpiData.lambda_patients_jour || meta.lambda_patients_jour  || 35,
          simulation_hours:     kpiData.simulation_hours     || meta.simulation_hours      || 8,
        };

        this.service.set(svc);
        this.kpisLoaded.set(true);
        this.loading.set(false);

        // ✅ FIX : appel Flask direct pour corriger A4=0 de Laravel
        this.fixA4FromFlask(svc, kpis);
      },
      error: () => {
        this.service.set({
          id: this.svcId, name: 'Service', status: 'normal',
          doctors: 0, nurses: 0, beds: 0, patients: 0,
          availableBeds: 0, equipment: [], kpis: {}
        } as any);
        this.kpisLoaded.set(true);
        this.loading.set(false);
      }
    });
  }

  // ✅ Appel Flask direct — contourne Laravel qui retourne A4=0
  private fixA4FromFlask(svc: any, kpis: any) {
    this.http.post<any>('http://localhost:5000/service-kpis', {
      patients:             svc.patients             || 1,
      beds:                 svc.beds                 || 1,
      doctors:              svc.doctors              || 1,
      nurses:               svc.nurses               || 1,
      dms_heures:           svc.dms_heures           || 96,
      mortalite_base:       svc.mortalite_base        || 1.5,
      lambda_patients_jour: svc.lambda_patients_jour || 35,
      simulation_hours:     svc.simulation_hours     || 8
    }).subscribe({
      next: (flask: any) => {
        const a4 = +(flask?.SSI?.A4_temps_attente ?? 0);
        if (a4 > 0) {
          // Mise à jour du signal service avec A4 correct
          this.service.update(cur => {
            if (!cur) return cur;
            const curAny = cur as any;
            const updatedKpis = {
              ...curAny.kpis,
              SSI: { ...(curAny.kpis?.SSI ?? {}), A4_temps_attente: a4 }
            };
            return { ...curAny, kpis: updatedKpis };
          });
        }
      },
      error: () => {}
    });
  }

  back() { this.router.navigate(['/hospitals', this.hospitalId, 'services', this.svcId]); }
  goSim() { this.router.navigate(['/simulation'], { queryParams: { serviceId: this.svcId } }); }

  catLabel(): string {
    return {SSI:'A — Flux Patients',IIP:'C — Qualité Clinique',ESI:'B — Finances',TI:'D — Infrastructure'}[this.category] ?? '';
  }
  catTagline(): string {
    return {SSI:'Indicateurs Sociaux & Flux',IIP:'Indicateurs de Processus Internes',ESI:'Indicateurs Économiques',TI:'Indicateurs Techniques'}[this.category] ?? '';
  }
  catIcon(): string {
    return {SSI:'users',IIP:'heart-pulse',ESI:'trending-up',TI:'settings-2'}[this.category] ?? 'bar-chart';
  }
  catMainColor(): string {
    return {SSI:'#00BCD4',IIP:'#E53935',ESI:'#43A047',TI:'#FB8C00'}[this.category] ?? PRIMARY;
  }
  catGradient(): string {
    return {
      SSI:'linear-gradient(135deg,#00BCD4,#0288D1)',
      IIP:'linear-gradient(135deg,#E53935,#B71C1C)',
      ESI:'linear-gradient(135deg,#43A047,#2E7D32)',
      TI: 'linear-gradient(135deg,#FB8C00,#F57200)',
    }[this.category] ?? 'linear-gradient(135deg,#00BCD4,#0288D1)';
  }

  kpi(svc: Service, key: string, cat: string): number {
    const s = svc as any;
    const k = s.kpis;
    // ✅ Pour A4 : accepte seulement les valeurs > 0 (0 = bug Laravel)
    if (key === 'A4_temps_attente') {
      const v = k?.[cat]?.[key];
      if (v !== undefined && v !== null && v > 0) return v;
      return 0; // Sera mis à jour par fixA4FromFlask
    }
    if (k?.[cat]?.[key] !== undefined && k[cat][key] !== null) return k[cat][key];
    const directMap: Record<string, string> = {
      'D5_distribution_eq':  'score_distribution_eq',
      'D11_gestion_dechets': 'score_gestion_dechets',
      'D12_localisation':    'scoreLocalisation',
      'D13_air_interieur':   'scoreAirInterieur',
      'D14_acoustique':      'scoreAcoustique',
      'A2_dms':              'dmsHeures',
    };
    if (directMap[key] && s[directMap[key]] !== undefined && s[directMap[key]] !== 0) {
      const v = s[directMap[key]];
      if (key === 'A2_dms') return Math.round(v / 24 * 10) / 10;
      return v;
    }
    return this.defaultKpi(key);
  }

  private defaultKpi(key: string): number {
    const defaults: Record<string, number> = {
      A2_dms: 4.7, A4_temps_attente: 0, A8_lits_vacants: 18, A9_taux_transfert: 7,
      C2_occupation: 82, C3_mortalite: 2.1, C4_infection: 3.2,
      B1_cout_soins: 4820, B4_cout_lit: 650, B5_cout_med_eq: 1200000, B7_cout_personnel: 1930000,
      D5_distribution_eq: 74, D11_gestion_dechets: 68, D12_localisation: 81,
      D13_air_interieur: 76, D14_acoustique: 62,
    };
    return defaults[key] ?? 0;
  }

  kpiColor(v: number, lib: boolean, ok: number, warn: number): string {
    if (lib) return v <= ok ? GREEN : v <= warn ? ORANGE : RED;
    return v >= ok ? GREEN : v >= warn ? ORANGE : RED;
  }
  kpiStatus(v: number, lib: boolean, ok: number, warn: number): string {
    const c = this.kpiColor(v, lib, ok, warn);
    return c === GREEN ? 'Dans la norme' : c === ORANGE ? 'Attention' : 'Critique';
  }

  formatDA(v: number): string { return v >= 1000 ? (v / 1000).toFixed(0) + ' k' : v.toFixed(0); }
  formatM(v: number): string  { return (v / 1000000).toFixed(2); }
}