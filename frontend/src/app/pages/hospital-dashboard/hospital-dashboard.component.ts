import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../shared/api.service';
import { Alert, DashboardStats, Hospital, Service } from '../../shared/models';
import { environment } from '../../../environments/environment';

const PRIMARY = '#00BCD4'; const PRIMARY_DARK = '#0288D1';
const GREEN = '#43A047'; const ORANGE = '#FB8C00'; const RED = '#E53935';

type KpiCategory = 'SSI' | 'IIP' | 'ESI' | 'TI' | null;

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="flex flex-col h-full bg-background">

  <!-- HEADER -->
  <div class="px-6 py-4 bg-card border-b flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <button (click)="back()" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
        <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
      </button>
      <div>
        <h1 class="text-lg font-bold text-foreground leading-tight">{{ hospital()?.name }}</h1>
        <div class="text-xs text-muted-foreground">{{ hospital()?.address }}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <span *ngIf="hospital() as h" class="text-xs font-bold px-3 py-1.5 rounded-full uppercase"
            [style.backgroundColor]="statusColor(h.loadStatus)+'18'" [style.color]="statusColor(h.loadStatus)">
        {{ statusLabel(h.loadStatus) }}
      </span>
      <a [routerLink]="['/hospitals', hospitalId, 'services']"
         class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5">
        <lucide-icon name="layout-grid" class="w-3.5 h-3.5"></lucide-icon>Services
      </a>
      <a routerLink="/simulation"
         class="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
         style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="brain" class="w-3.5 h-3.5"></lucide-icon>Simulation
      </a>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-5">
  <div *ngIf="loading()" class="flex items-center justify-center h-40 text-muted-foreground text-sm">
    <div class="flex items-center gap-2"><lucide-icon name="loader-2" class="w-4 h-4 animate-spin" style="color:#00BCD4"></lucide-icon>Chargement…</div>
  </div>

  <div *ngIf="!loading()" class="max-w-6xl mx-auto space-y-5">

    <!-- ── MÉTRIQUES ── -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-card rounded-2xl border shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#00BCD418">
          <lucide-icon name="users" class="w-5 h-5" style="color:#00BCD4"></lucide-icon>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-muted-foreground">Personnel</div>
          <div class="text-2xl font-bold" style="color:#00BCD4">{{ totalPersonnel() }}</div>
          <div class="text-[10px] text-muted-foreground mt-0.5">{{ hospital()?.total_doctors }} méd · {{ hospital()?.total_nurses }} inf</div>
        </div>
      </div>

      <div class="bg-card rounded-2xl border shadow-sm p-4 flex items-center gap-3"
           [style.borderColor]="alerts().length>0?RED+'40':''"
           [style.backgroundColor]="alerts().length>0?RED+'05':''">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             [style.backgroundColor]="(alerts().length>0?RED:GREEN)+'18'">
          <lucide-icon [name]="alerts().length>0?'alert-triangle':'check-circle'" class="w-5 h-5"
                       [style.color]="alerts().length>0?RED:GREEN"></lucide-icon>
        </div>
        <div class="flex-1">
          <div class="text-xs text-muted-foreground">Alertes actives</div>
          <div class="text-2xl font-bold" [style.color]="alerts().length>0?RED:GREEN">{{ alerts().length }}</div>
          <div class="text-[10px] text-muted-foreground mt-0.5">{{ services().length }} services · {{ hospital()?.active_patients }} patients</div>
        </div>
      </div>
    </div>

    <!-- ── 4 CATÉGORIES KPIs ── -->
    <div>
      <div class="flex items-center gap-2 px-1 mb-4">
        <span class="w-1.5 h-4 rounded-full" style="background:#00BCD4"></span>
        <span class="text-xs font-bold text-foreground uppercase tracking-wider">Indicateurs de Performance — Cliquer pour les représentations détaillées</span>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <!-- SSI -->
        <button (click)="selectCategory('SSI')"
                class="rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all"
                [style.borderColor]="activeCategory()==='SSI'?'#00BCD4':'#00BCD430'"
                [style.background]="activeCategory()==='SSI'?'#00BCD410':'var(--card)'">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#00BCD420">
              <lucide-icon name="users" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
            </div>
            <div><div class="text-xs font-bold text-foreground">A — Flux Patients</div><div class="text-[9px] text-muted-foreground">SSI</div></div>
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)+'25'" [style.color]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)">A4: {{ kpiVal('A4_temps_attente') | number:'1.0-0' }}min</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)+'25'" [style.color]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)">A9: {{ kpiVal('A9_taux_transfert') | number:'1.0-1' }}%</span>
          </div>
          <div *ngIf="activeCategory()==='SSI'" class="mt-2 text-[10px] font-bold" style="color:#00BCD4">▼ Détails ci-dessous</div>
        </button>
        <!-- IIP -->
        <button (click)="selectCategory('IIP')"
                class="rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all"
                [style.borderColor]="activeCategory()==='IIP'?'#E53935':'#E5393530'"
                [style.background]="activeCategory()==='IIP'?'#E5393510':'var(--card)'">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#E5393520">
              <lucide-icon name="heart-pulse" class="w-4 h-4" style="color:#E53935"></lucide-icon>
            </div>
            <div><div class="text-xs font-bold text-foreground">C — Qualité Clinique</div><div class="text-[9px] text-muted-foreground">IIP</div></div>
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('C2_occupation'),true,85,92)+'25'" [style.color]="kpiColor(kpiVal('C2_occupation'),true,85,92)">C2: {{ kpiVal('C2_occupation') | number:'1.0-0' }}%</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('C3_mortalite'),true,2,4)+'25'" [style.color]="kpiColor(kpiVal('C3_mortalite'),true,2,4)">C3: {{ kpiVal('C3_mortalite') | number:'1.0-1' }}%</span>
          </div>
          <div *ngIf="activeCategory()==='IIP'" class="mt-2 text-[10px] font-bold" style="color:#E53935">▼ Détails ci-dessous</div>
        </button>
        <!-- ESI -->
        <button (click)="selectCategory('ESI')"
                class="rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all"
                [style.borderColor]="activeCategory()==='ESI'?'#43A047':'#43A04730'"
                [style.background]="activeCategory()==='ESI'?'#43A04710':'var(--card)'">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#43A04720">
              <lucide-icon name="trending-up" class="w-4 h-4" style="color:#43A047"></lucide-icon>
            </div>
            <div><div class="text-xs font-bold text-foreground">B — Finances</div><div class="text-[9px] text-muted-foreground">ESI</div></div>
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">B1: {{ formatDA(kpiVal('B1_cout_soins')) }}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">B7: {{ formatM(kpiVal('B7_cout_personnel')) }}M</span>
          </div>
          <div *ngIf="activeCategory()==='ESI'" class="mt-2 text-[10px] font-bold" style="color:#43A047">▼ Détails ci-dessous</div>
        </button>
        <!-- TI -->
        <button (click)="selectCategory('TI')"
                class="rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all"
                [style.borderColor]="activeCategory()==='TI'?'#FB8C00':'#FB8C0030'"
                [style.background]="activeCategory()==='TI'?'#FB8C0010':'var(--card)'">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#FB8C0020">
              <lucide-icon name="settings-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
            </div>
            <div><div class="text-xs font-bold text-foreground">D — Infrastructure</div><div class="text-[9px] text-muted-foreground">TI</div></div>
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('D5_distribution_eq'),false,90,70)+'25'" [style.color]="kpiColor(kpiVal('D5_distribution_eq'),false,90,70)">D5: {{ kpiVal('D5_distribution_eq') | number:'1.0-0' }}/100</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(kpiVal('D13_air_interieur'),false,75,50)+'25'" [style.color]="kpiColor(kpiVal('D13_air_interieur'),false,75,50)">D13: {{ kpiVal('D13_air_interieur') | number:'1.0-0' }}/100</span>
          </div>
          <div *ngIf="activeCategory()==='TI'" class="mt-2 text-[10px] font-bold" style="color:#FB8C00">▼ Détails ci-dessous</div>
        </button>
      </div>

      <!-- DÉTAIL SSI -->
      <div *ngIf="activeCategory()==='SSI'" class="space-y-4">
        <div class="rounded-2xl border-2 p-4" style="border-color:#00BCD430;background:#00BCD405">
          <div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#00BCD4"></lucide-icon><span class="text-sm font-bold" style="color:#00BCD4">A — Flux Patients (SSI)</span></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-5">
            <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A2 — Durée Moy. Séjour</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('A2_dms'),true,4.5,7)+'18'" [style.color]="kpiColor(kpiVal('A2_dms'),true,4.5,7)">{{ kpiStatus(kpiVal('A2_dms'),true,4.5,7) }}</span></div>
            <div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiVal('A2_dms'),true,4.5,7)">{{ kpiVal('A2_dms') | number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">jours</span></div>
            <div class="h-2 rounded-full bg-muted overflow-hidden mb-1"><div class="h-full rounded-full" [style.backgroundColor]="kpiColor(kpiVal('A2_dms'),true,4.5,7)" [style.width.%]="Math.min(kpiVal('A2_dms')/14*100,100)"></div></div>
          </div>
          <div class="bg-card rounded-2xl border shadow-sm p-5">
            <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A4 — Temps d'Attente</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)+'18'" [style.color]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)">{{ kpiStatus(kpiVal('A4_temps_attente'),true,20,40) }}</span></div>
            <div class="flex justify-center mb-2"><div class="relative" style="width:130px;height:72px"><svg viewBox="0 0 130 72" class="w-full h-full"><path d="M 10 67 A 55 55 0 0 1 120 67" fill="none" stroke="#e2e8f0" stroke-width="9" stroke-linecap="round"/><path d="M 10 67 A 55 55 0 0 1 120 67" fill="none" [attr.stroke]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)" stroke-width="9" stroke-linecap="round" stroke-dasharray="173" [attr.stroke-dashoffset]="173-(173*Math.min(kpiVal('A4_temps_attente'),60)/60)"/><text x="65" y="58" text-anchor="middle" font-size="16" font-weight="700" [attr.fill]="kpiColor(kpiVal('A4_temps_attente'),true,20,40)">{{ kpiVal('A4_temps_attente') | number:'1.0-0' }}</text><text x="65" y="70" text-anchor="middle" font-size="7" fill="#90A4AE">minutes</text></svg></div></div>
          </div>
          <div class="bg-card rounded-2xl border shadow-sm p-5">
            <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A8 — Taux Lits Vacants</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('A8_lits_vacants'),false,15,8)+'18'" [style.color]="kpiColor(kpiVal('A8_lits_vacants'),false,15,8)">{{ kpiStatus(kpiVal('A8_lits_vacants'),false,15,8) }}</span></div>
            <div class="flex items-center gap-4"><div class="relative flex-shrink-0" style="width:80px;height:80px"><svg viewBox="0 0 80 80" class="w-full h-full -rotate-90"><circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="10"/><circle cx="40" cy="40" r="30" fill="none" [attr.stroke]="kpiColor(kpiVal('A8_lits_vacants'),false,15,8)" stroke-width="10" stroke-linecap="round" stroke-dasharray="188" [attr.stroke-dashoffset]="188-(188*kpiVal('A8_lits_vacants')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-base font-bold" [style.color]="kpiColor(kpiVal('A8_lits_vacants'),false,15,8)">{{ kpiVal('A8_lits_vacants') | number:'1.0-0' }}%</span><span class="text-[8px] text-muted-foreground">vacants</span></div></div><div class="flex-1 space-y-1 text-xs"><div class="flex justify-between"><span class="text-muted-foreground">Vacants</span><span class="font-bold" [style.color]="kpiColor(kpiVal('A8_lits_vacants'),false,15,8)">{{ kpiVal('A8_lits_vacants') | number:'1.0-0' }}%</span></div><div class="flex justify-between"><span class="text-muted-foreground">Occupés</span><span class="font-bold text-muted-foreground">{{ 100-kpiVal('A8_lits_vacants') | number:'1.0-0' }}%</span></div><div class="flex justify-between"><span class="text-muted-foreground">Total lits</span><span class="font-bold text-foreground">{{ hospital()?.total_beds }}</span></div></div></div>
          </div>
          <div class="bg-card rounded-2xl border shadow-sm p-5">
            <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="arrow-right" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A9 — Taux de Transfert</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)+'18'" [style.color]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)">{{ kpiStatus(kpiVal('A9_taux_transfert'),true,2,5) }}</span></div>
            <div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)">{{ kpiVal('A9_taux_transfert') | number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div>
            <div class="relative h-3 rounded-full overflow-hidden bg-muted mb-1"><div class="absolute h-full rounded-full" [style.width.%]="Math.min(kpiVal('A9_taux_transfert')/15*100,100)" [style.backgroundColor]="kpiColor(kpiVal('A9_taux_transfert'),true,2,5)"></div></div>
          </div>
        </div>
      </div>

      <!-- DÉTAIL IIP -->
      <div *ngIf="activeCategory()==='IIP'" class="space-y-4">
        <div class="rounded-2xl border-2 p-4" style="border-color:#E5393530;background:#E5393505"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#E53935"></lucide-icon><span class="text-sm font-bold" style="color:#E53935">C — Qualité Clinique (IIP)</span></div></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C2 — Occupation</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('C2_occupation'),true,85,92)+'18'" [style.color]="kpiColor(kpiVal('C2_occupation'),true,85,92)">{{ kpiStatus(kpiVal('C2_occupation'),true,85,92) }}</span></div><div class="flex justify-center mb-2"><div class="relative" style="width:100px;height:100px"><svg viewBox="0 0 100 100" class="w-full h-full -rotate-90"><circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="12"/><circle cx="50" cy="50" r="40" fill="none" [attr.stroke]="kpiColor(kpiVal('C2_occupation'),true,85,92)" stroke-width="12" stroke-linecap="round" stroke-dasharray="251" [attr.stroke-dashoffset]="251-(251*kpiVal('C2_occupation')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-xl font-bold" [style.color]="kpiColor(kpiVal('C2_occupation'),true,85,92)">{{ kpiVal('C2_occupation') | number:'1.0-0' }}%</span><span class="text-[9px] text-muted-foreground">occupation</span></div></div></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="heart" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C3 — Mortalité</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('C3_mortalite'),true,2,4)+'18'" [style.color]="kpiColor(kpiVal('C3_mortalite'),true,2,4)">{{ kpiStatus(kpiVal('C3_mortalite'),true,2,4) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiVal('C3_mortalite'),true,2,4)">{{ kpiVal('C3_mortalite') | number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div><div class="relative h-2 rounded-full bg-muted mb-1"><div class="absolute h-full rounded-full w-1/3" style="background:linear-gradient(90deg,#43A047,#FB8C00)"></div><div class="absolute h-full rounded-full w-1/3" style="left:33%;background:linear-gradient(90deg,#FB8C00,#E53935)"></div><div class="absolute h-full rounded-full w-1/3" style="left:66%;background:#E53935"></div><div class="absolute w-3 h-3 rounded-full border-2 border-white shadow" [style.left.%]="Math.min(kpiVal('C3_mortalite')/6*100,100)" style="top:-2px;transform:translateX(-50%)" [style.backgroundColor]="kpiColor(kpiVal('C3_mortalite'),true,2,4)"></div></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="alert-circle" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C4 — Infections</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiVal('C4_infection'),true,1,3)+'18'" [style.color]="kpiColor(kpiVal('C4_infection'),true,1,3)">{{ kpiStatus(kpiVal('C4_infection'),true,1,3) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiVal('C4_infection'),true,1,3)">{{ kpiVal('C4_infection') | number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div><div class="relative h-3 rounded-full overflow-hidden bg-muted mb-1"><div class="absolute h-full rounded-full" [style.width.%]="Math.min(kpiVal('C4_infection')/6*100,100)" [style.backgroundColor]="kpiColor(kpiVal('C4_infection'),true,1,3)"></div></div></div>
        </div>
      </div>

      <!-- DÉTAIL ESI -->
      <div *ngIf="activeCategory()==='ESI'" class="space-y-4">
        <div class="rounded-2xl border-2 p-4" style="border-color:#43A04730;background:#43A04705"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#43A047"></lucide-icon><span class="text-sm font-bold" style="color:#43A047">B — Indicateurs Financiers (ESI)</span></div></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-5 col-span-2"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#43A04720"><lucide-icon name="trending-up" class="w-3.5 h-3.5" style="color:#43A047"></lucide-icon></div><span class="text-sm font-bold text-foreground">B1 — Coût Moyen des Soins</span></div><div class="text-center mb-3"><span class="text-3xl font-bold" style="color:#43A047">{{ formatDA(kpiVal('B1_cout_soins')) }}</span><span class="text-sm text-muted-foreground ml-1">DA/patient</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="text-sm font-bold text-foreground mb-2">B4 — Coût/lit/jour</div><div class="text-2xl font-bold mb-1" style="color:#43A047">{{ formatDA(kpiVal('B4_cout_lit')) }}</div><div class="text-[10px] text-muted-foreground">DA/lit/jour</div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="text-sm font-bold text-foreground mb-2">B7 — Personnel</div><div class="text-2xl font-bold mb-1" style="color:#43A047">{{ formatM(kpiVal('B7_cout_personnel')) }}</div><div class="text-[10px] text-muted-foreground">MDA/mois</div></div>
        </div>
      </div>

      <!-- DÉTAIL TI -->
      <div *ngIf="activeCategory()==='TI'" class="space-y-4">
        <div class="rounded-2xl border-2 p-4" style="border-color:#FB8C0030;background:#FB8C0005"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#FB8C00"></lucide-icon><span class="text-sm font-bold" style="color:#FB8C00">D — Infrastructure Technique (TI)</span></div></div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="stethoscope" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><span class="text-sm font-bold text-foreground">D5 — Équipements</span></div><div class="flex justify-center"><div class="relative" style="width:80px;height:80px"><svg viewBox="0 0 80 80" class="w-full h-full -rotate-90"><circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="10"/><circle cx="40" cy="40" r="30" fill="none" [attr.stroke]="kpiColor(kpiVal('D5_distribution_eq'),false,90,70)" stroke-width="10" stroke-linecap="round" stroke-dasharray="188" [attr.stroke-dashoffset]="188-(188*kpiVal('D5_distribution_eq')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-base font-bold" [style.color]="kpiColor(kpiVal('D5_distribution_eq'),false,90,70)">{{ kpiVal('D5_distribution_eq') | number:'1.0-0' }}</span><span class="text-[8px] text-muted-foreground">/100</span></div></div></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="trash-2" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><span class="text-sm font-bold text-foreground">D11 — DASRI</span></div><div class="flex justify-center"><div class="relative" style="width:110px;height:62px"><svg viewBox="0 0 110 62" class="w-full h-full"><path d="M 8 57 A 47 47 0 0 1 102 57" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/><path d="M 8 57 A 47 47 0 0 1 102 57" fill="none" [attr.stroke]="kpiColor(kpiVal('D11_gestion_dechets'),false,80,60)" stroke-width="8" stroke-linecap="round" stroke-dasharray="148" [attr.stroke-dashoffset]="148-(148*kpiVal('D11_gestion_dechets')/100)"/><text x="55" y="50" text-anchor="middle" font-size="14" font-weight="700" [attr.fill]="kpiColor(kpiVal('D11_gestion_dechets'),false,80,60)">{{ kpiVal('D11_gestion_dechets') | number:'1.0-0' }}</text><text x="55" y="60" text-anchor="middle" font-size="6" fill="#90A4AE">/100</text></svg></div></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="activity" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><span class="text-sm font-bold text-foreground">D12 — Accessibilité</span></div><div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(kpiVal('D12_localisation'),false,75,50)">{{ kpiVal('D12_localisation') | number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="activity" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><span class="text-sm font-bold text-foreground">D13 — Qualité Air</span></div><div class="text-center mb-2"><span class="text-3xl font-bold" [style.color]="kpiColor(kpiVal('D13_air_interieur'),false,75,50)">{{ kpiVal('D13_air_interieur') | number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="volume-2" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><span class="text-sm font-bold text-foreground">D14 — Acoustique</span></div><div class="text-center mb-2"><span class="text-3xl font-bold" [style.color]="kpiColor(kpiVal('D14_acoustique'),false,70,50)">{{ kpiVal('D14_acoustique') | number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="text-sm font-bold text-foreground mb-3">Synthèse TI</div><div class="space-y-2"><div *ngFor="let ti of tiSummary()" class="flex items-center gap-2"><span class="text-[9px] text-muted-foreground w-20 flex-shrink-0">{{ ti.label }}</span><div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" [style.backgroundColor]="ti.color" [style.width.%]="ti.val"></div></div><span class="text-[9px] font-bold w-10 text-right" [style.color]="ti.color">{{ ti.val | number:'1.0-0' }}/100</span></div></div></div>
        </div>
      </div>
    </div>

    <!-- ── SERVICES TRIAGE ── -->
    <div>
      <div class="flex items-center justify-between px-1 mb-3">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 rounded-full" style="background:#00BCD4"></span>
          <span class="text-xs font-bold text-foreground uppercase tracking-wider">Services — Vue triage</span>
          <span *ngIf="criticalCount()>0" class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:#E5393518;color:#E53935">{{ criticalCount() }} critique{{ criticalCount()>1?'s':'' }}</span>
        </div>
        <a [routerLink]="['/hospitals', hospitalId, 'services']" class="text-xs font-semibold flex items-center gap-1" style="color:#00BCD4">
          Détail <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
        </a>
      </div>
      <div class="space-y-2">
        <div *ngFor="let s of services()" class="bg-card rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3"
             [style.borderLeftWidth]="'3px'" [style.borderLeftColor]="statusColor(s.status)">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-foreground truncate">{{ s.name }}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    [style.backgroundColor]="statusColor(s.status)+'18'"
                    [style.color]="statusColor(s.status)">{{ statusLabel(s.status) }}</span>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full" [style.backgroundColor]="statusColor(s.status)" [style.width.%]="svcLoadPct(s)"></div>
              </div>
              <span class="text-[10px] font-bold flex-shrink-0" [style.color]="statusColor(s.status)">{{ svcLoadPct(s) }}%</span>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0 text-center">
            <div><div class="text-sm font-bold text-foreground">{{ s.doctors }}</div><div class="text-[9px] text-muted-foreground">méd.</div></div>
            <div class="w-px h-6 bg-border"></div>
            <div><div class="text-sm font-bold text-foreground">{{ s.nurses }}</div><div class="text-[9px] text-muted-foreground">inf.</div></div>
            <div class="w-px h-6 bg-border"></div>
            <div><div class="text-sm font-bold text-foreground">{{ s.patients }}</div><div class="text-[9px] text-muted-foreground">patients</div></div>
            <div class="w-px h-6 bg-border"></div>
            <div>
              <div class="text-sm font-bold" [style.color]="((s.beds - s.patients) <= 2)?RED:GREEN">{{ (s.beds - s.patients) > 0 ? (s.beds - s.patients) : 0 }}</div>
              <div class="text-[9px] text-muted-foreground">lits lib.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ALERTES ── -->
    <div *ngIf="alerts().length > 0" class="pb-4">
      <div class="flex items-center gap-2 px-1 mb-3">
        <span class="w-1.5 h-4 rounded-full" style="background:#E53935"></span>
        <span class="text-xs font-bold text-foreground uppercase tracking-wider">Alertes</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:#E5393518;color:#E53935">{{ alerts().length }}</span>
      </div>
      <div class="space-y-2">
        <div *ngFor="let a of alerts()" class="flex items-center gap-3 px-4 py-3 rounded-xl border"
             [style.backgroundColor]="(a.severity==='critical'||a.severity==='high'?RED:ORANGE)+'06'"
             [style.borderColor]="(a.severity==='critical'||a.severity==='high'?RED:ORANGE)+'30'">
          <lucide-icon [name]="a.severity==='critical'||a.severity==='high'?'alert-triangle':'alert-circle'" class="w-4 h-4 flex-shrink-0" [style.color]="a.severity==='critical'||a.severity==='high'?RED:ORANGE"></lucide-icon>
          <div class="flex-1 min-w-0"><div class="text-sm font-semibold text-foreground">{{ a.title }}</div><div class="text-xs text-muted-foreground">{{ a.message }}</div></div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" [style.backgroundColor]="(a.severity==='critical'||a.severity==='high'?RED:ORANGE)+'18'" [style.color]="a.severity==='critical'||a.severity==='high'?RED:ORANGE">{{ a.severity==='critical'||a.severity==='high'?'Critique':'Attention' }}</span>
        </div>
      </div>
    </div>

    <!-- ── BOUTON SIMULATION ── -->
    <div class="pb-4">
      <div class="rounded-2xl border p-4 flex items-center justify-between gap-4" style="border-color:#00BCD430;background:#00BCD405">
        <div>
          <div class="text-sm font-bold text-foreground mb-1">Simuler des décisions pour cet hôpital</div>
          <div class="text-xs text-muted-foreground">Testez l'impact de vos décisions avant de les appliquer au système réel</div>
        </div>
        <a routerLink="/simulation" class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md flex-shrink-0" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
          <lucide-icon name="brain" class="w-4 h-4"></lucide-icon>Centre de Simulation
        </a>
      </div>
    </div>

  </div>
  </div>
</div>
  `,
})
export class HospitalDashboardComponent implements OnInit {
  private api    = inject(ApiService);
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  readonly Math = Math;
  readonly PRIMARY = PRIMARY; readonly GREEN = GREEN;
  readonly ORANGE = ORANGE; readonly RED = RED;

  hospitalId     = 0;
  hospital       = signal<Hospital | null>(null);
  services       = signal<Service[]>([]);
  alerts         = signal<Alert[]>([]);
  loading        = signal(true);
  activeCategory = signal<KpiCategory>(null);
  private _kpisData    = signal<Record<string, number>>({});
  private _svcA4Map    = signal<Record<number, number>>({});

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    forkJoin({
      hospital: this.api.getHospital(this.hospitalId),
      services: this.api.listServices(this.hospitalId),
      alerts:   this.api.getHospitalAlerts(this.hospitalId),
    }).subscribe({
      next: ({ hospital, services, alerts }) => {
        this.hospital.set(hospital);
        this.services.set(services);
        this.alerts.set(alerts);
        this.computeGlobalKpis(services);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeGlobalKpis(svcs: Service[]) {
    if (!svcs.length) return;
    const keys = ['A2_dms','A4_temps_attente','A8_lits_vacants','A9_taux_transfert',
                  'C2_occupation','C3_mortalite','C4_infection',
                  'B1_cout_soins','B4_cout_lit','B5_cout_med_eq','B7_cout_personnel',
                  'D5_distribution_eq','D11_gestion_dechets','D12_localisation','D13_air_interieur','D14_acoustique'];

    const collected: Record<string, number[]> = {};
    keys.forEach(k => collected[k] = []);
    let pending = svcs.length;

    svcs.forEach(svc => {
      this.api.getServiceKpis(svc.id).subscribe({
        next: (data: any) => {
          // Support structure imbriquée ET plate — SKIP A4 (calculé directement par Flask)
          const kpis = data?.kpis ?? data ?? {};
          const skipKeys = new Set(['A4_temps_attente']);

          keys.forEach(key => {
            if (skipKeys.has(key)) return; // A4 géré par loadA4DirectFromFlask
            let val: number | undefined;
            // Nested SSI/IIP/ESI/TI
            for (const cat of ['SSI','IIP','ESI','TI']) {
              if (kpis[cat]?.[key] !== undefined) { val = +kpis[cat][key]; break; }
            }
            // Flat sur kpis
            if (val === undefined && kpis[key] !== undefined) val = +kpis[key];
            // Flat sur data directement
            if (val === undefined && data[key] !== undefined) val = +data[key];
            // Flat sur data.data (Laravel wrapping)
            if (val === undefined && data?.data?.[key] !== undefined) val = +data.data[key];

            if (val !== undefined && !isNaN(val) && val > 0) {
              collected[key].push(val);
            }
          });

          pending--;
          if (pending <= 0) this.finalizeKpis(collected);
        },
        error: () => {
          pending--;
          if (pending <= 0) this.finalizeKpis(collected);
        }
      });
    });

    // A4 calculé directement par Flask (Laravel retourne A4=0)
    this.loadA4DirectFromFlask(svcs, collected);

    setTimeout(() => {
      if (pending > 0) { pending = 0; this.finalizeKpis(collected); }
    }, 3000);
  }

  // A4 calculé directement depuis Flask — contourne Laravel qui retourne A4=0
  private loadA4DirectFromFlask(svcs: Service[], collected: Record<string, number[]>) {
    svcs.forEach(svc => {
      const s = svc as any;
      const body = {
        patients:             svc.patients  || 1,
        beds:                 svc.beds      || 1,
        doctors:              svc.doctors   || 1,
        nurses:               svc.nurses    || 1,
        dms_heures:           s.dms_heures           || 96,
        mortalite_base:       s.mortalite_base       || 1.5,
        lambda_patients_jour: s.lambda_patients_jour || 35,
        simulation_hours:     s.simulation_hours     || 8
      };
      this.http.post<any>(`${environment.simUrl}/service-kpis`, body).subscribe({
        next: (flask: any) => {
          const a4 = +(flask?.SSI?.A4_temps_attente ?? 0);
          if (a4 > 0) {
            collected['A4_temps_attente'].push(a4);
            const vals = collected['A4_temps_attente'];
            const avg  = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
            this._kpisData.set({ ...this._kpisData(), A4_temps_attente: avg });
          }
        },
        error: () => {}
      });
    });
  }

  private finalizeKpis(collected: Record<string, number[]>) {
    const result: Record<string, number> = {};
    Object.entries(collected).forEach(([key, vals]) => {
      if (vals.length > 0) {
        result[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
      }
    });
    const h = this.hospital();
    if (h) {
      if (!result['D12_localisation']) result['D12_localisation'] = (h as any).scoreLocalisation ?? 81;
      if (!result['D13_air_interieur']) result['D13_air_interieur'] = (h as any).scoreAirInterieur ?? 76;
      if (!result['D14_acoustique'])   result['D14_acoustique']   = (h as any).scoreAcoustique ?? 62;
    }
    this._kpisData.set(result);
  }

  back() { this.router.navigate(['/']); }
  selectCategory(cat: KpiCategory) { this.activeCategory.set(this.activeCategory() === cat ? null : cat); }
  kpiVal(key: string): number { return this._kpisData()[key] || 0; }

  kpiColor(v: number, lib: boolean, okT: number, warnT: number): string {
    if (lib) return v <= okT ? GREEN : v <= warnT ? ORANGE : RED;
    return v >= okT ? GREEN : v >= warnT ? ORANGE : RED;
  }
  kpiStatus(v: number, lib: boolean, okT: number, warnT: number): string {
    const c = this.kpiColor(v, lib, okT, warnT);
    return c === GREEN ? 'Dans la norme' : c === ORANGE ? 'Attention' : 'Critique';
  }

  tiSummary(): any[] {
    return [
      { label: 'D5 Équipements', val: this.kpiVal('D5_distribution_eq'), color: this.kpiColor(this.kpiVal('D5_distribution_eq'), false, 90, 70) },
      { label: 'D11 DASRI',      val: this.kpiVal('D11_gestion_dechets'),color: this.kpiColor(this.kpiVal('D11_gestion_dechets'), false, 80, 60) },
      { label: 'D12 Accès',      val: this.kpiVal('D12_localisation'),   color: this.kpiColor(this.kpiVal('D12_localisation'), false, 75, 50) },
      { label: 'D13 Air',        val: this.kpiVal('D13_air_interieur'),  color: this.kpiColor(this.kpiVal('D13_air_interieur'), false, 75, 50) },
      { label: 'D14 Acoustique', val: this.kpiVal('D14_acoustique'),     color: this.kpiColor(this.kpiVal('D14_acoustique'), false, 70, 50) },
    ];
  }

  occPct(): number {
    const h = this.hospital() as any;
    if (h) {
      const beds = h.total_beds || h.totalBeds || 0;
      const pts  = h.active_patients || h.patients || 0;
      if (beds > 0 && pts > 0) return Math.round(pts / beds * 100);
    }
    const svcs = this.services();
    const sBeds = svcs.reduce((a, s) => a + (s.beds || 0), 0);
    const sPts  = svcs.reduce((a, s) => a + (s.patients || 0), 0);
    return sBeds > 0 ? Math.round(sPts / sBeds * 100) : 75;
  }
  occColor(): string { const p = this.occPct(); return p >= 92 ? RED : p >= 85 ? ORANGE : GREEN; }

  totalPersonnel(): number {
    const h = this.hospital() as any;
    const fromH = ((h?.total_doctors || 0) + (h?.total_nurses || 0));
    if (fromH > 0) return fromH;
    return this.services().reduce((a, s) => a + (s.doctors || 0) + (s.nurses || 0), 0);
  }

  healthScore(): number {
    const occ  = this.occPct();
    const alrt = Math.min(this.alerts().length * 10, 30);
    const occScore = occ > 0 ? Math.max(0, 100 - occ) : 50;
    const a4 = this.kpiVal('A4_temps_attente');
    const c3 = this.kpiVal('C3_mortalite');
    const c4 = this.kpiVal('C4_infection');
    const kpiPenalty = Math.min(
      (a4 > 40 ? 20 : a4 > 20 ? 10 : 0) + (c3 > 4 ? 15 : c3 > 2 ? 8 : 0) + (c4 > 3 ? 15 : c4 > 1 ? 8 : 0), 40
    );
    return Math.max(10, Math.min(100, Math.round(occScore * 0.5 + (100 - kpiPenalty) * 0.5 - alrt)));
  }
  healthScoreColor(): string { const s = this.healthScore(); return s >= 70 ? GREEN : s >= 40 ? ORANGE : RED; }
  healthScoreLabel(): string { const s = this.healthScore(); return s >= 70 ? 'Fonctionnement normal' : s >= 40 ? 'Indicateurs tendus' : 'Intervention requise'; }

  svcLoadPct(s: Service): number { return s.beds > 0 ? Math.round((s.patients / s.beds) * 100) : 0; }
  criticalCount(): number { return this.services().filter(s => s.status === 'critical').length; }
  formatDA(v: number): string { return v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0); }
  formatM(v: number): string  { return (v / 1000000).toFixed(2); }

  statusColor(s: string): string {
    if (s === 'critical') return RED;
    if (s === 'high' || s === 'medium') return ORANGE;
    return GREEN;
  }
  statusLabel(s: string): string {
    if (s === 'critical') return 'CRITIQUE';
    if (s === 'high') return 'ÉLEVÉE';
    if (s === 'medium') return 'MOYENNE';
    return 'NORMALE';
  }
}