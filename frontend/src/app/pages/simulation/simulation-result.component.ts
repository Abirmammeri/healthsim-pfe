import {
  Component, OnInit, OnDestroy,
  inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { SimulationStoreService } from '../../shared/simulation-store.service';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';

const PRIMARY      = '#00BCD4';
const PRIMARY_DARK = '#0288D1';
const GREEN        = '#43A047';
const ORANGE       = '#FB8C00';
const RED          = '#E53935';
import { environment } from '../../../environments/environment';
const FLASK        = environment.simUrl;

type ApplyStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error';
type KpiCategory = 'SSI' | 'IIP' | 'ESI' | 'TI' | null;

@Component({
  selector: 'app-simulation-result',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
<ng-container *ngIf="data() as d; else empty">
<div class="flex flex-col h-full bg-background relative">

  <!-- HEADER -->
  <div class="px-6 py-4 bg-card border-b flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <a routerLink="/simulation" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
        <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
      </a>
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'">
        <lucide-icon name="activity" class="w-5 h-5 text-white"></lucide-icon>
      </div>
      <div>
        <h1 class="text-lg font-bold text-foreground">Résultats de simulation</h1>
        <p class="text-xs text-muted-foreground">{{ d.result?.scenario_name || 'Simulation DES' }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <div *ngFor="let k of anim()" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs"
           [style.borderColor]="k.color+'40'" [style.backgroundColor]="k.color+'08'">
        <lucide-icon [name]="k.icon" class="w-3 h-3 flex-shrink-0" [style.color]="k.color"></lucide-icon>
        <span class="text-muted-foreground">{{ k.label }}</span>
        <span class="font-bold" [style.color]="k.color">{{ k.val | number:'1.0-1' }}{{ k.unit }}</span>
        <span class="font-semibold text-[10px]" [style.color]="k.improved?GREEN:RED">{{ k.deltaStr }}</span>
      </div>
      <!-- Badge ML cliquable — auto-lancé, couleur = état prédit -->
      <button *ngIf="mlResults().length || mlLoading()"
              (click)="mlPanelOpen.set(!mlPanelOpen())"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all"
              [style.backgroundColor]="mlGlobalColor()+'20'"
              [style.color]="mlGlobalColor()">
        <lucide-icon [name]="mlLoading()?'loader-2':'brain'" class="w-3.5 h-3.5" [class.animate-spin]="mlLoading()"></lucide-icon>
        {{ mlLoading() ? 'Analyse ML…' : mlShortLabel() }}
      </button>
      <button *ngIf="applyStatus()==='idle'||applyStatus()==='error'" (click)="startApply()"
              class="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5"
              [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'">
        <lucide-icon name="check-circle" class="w-3.5 h-3.5"></lucide-icon>Appliquer
      </button>
      <div *ngIf="applyStatus()==='success'" class="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl" [style.backgroundColor]="GREEN+'18'" [style.color]="GREEN">
        <lucide-icon name="check-circle" class="w-3.5 h-3.5"></lucide-icon>Appliqué
      </div>
    </div>
  </div>

  <!-- PANEL ML — s'ouvre au clic sur le badge -->
  <div *ngIf="mlPanelOpen() && mlResults().length" class="border-b px-6 py-4 space-y-3"
       [style.backgroundColor]="mlGlobalColor()+'06'"
       [style.borderColor]="mlGlobalColor()+'30'">
    <div class="flex items-center gap-3 rounded-xl p-3" [style.backgroundColor]="mlGlobalColor()+'12'">
      <span class="text-2xl">{{ mlGlobalEmoji() }}</span>
      <div class="flex-1">
        <div class="text-sm font-bold text-foreground">Verdict global après simulation</div>
        <div class="text-xs font-bold" [style.color]="mlGlobalColor()">{{ mlGlobalLongLabel() }}</div>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-xl font-bold" [style.color]="mlGlobalColor()">{{ mlConfiance() }}%</div>
        <div class="text-[10px] text-muted-foreground">confiance moy.</div>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div *ngFor="let r of mlResults()" class="rounded-xl border p-3 space-y-2"
           [style.borderColor]="mlLabelColor(r.prediction?.label)+'40'"
           [style.backgroundColor]="mlLabelColor(r.prediction?.label)+'08'">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-foreground">{{ r.service_name }}</span>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                [style.backgroundColor]="mlLabelColor(r.prediction?.label)+'20'"
                [style.color]="mlLabelColor(r.prediction?.label)">{{ r.prediction?.label }}</span>
        </div>
        <div class="space-y-1">
          <div *ngFor="let cls of ['Normal','Attention','Critique']" class="flex items-center gap-1.5">
            <span class="text-[8px] text-muted-foreground w-12 flex-shrink-0">{{ cls }}</span>
            <div class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full" [style.backgroundColor]="mlLabelColor(cls)"
                   [style.width.%]="(r.prediction?.probabilites?.[cls]||0)*100"></div>
            </div>
            <span class="text-[8px] font-bold w-7 text-right" [style.color]="mlLabelColor(cls)">
              {{ ((r.prediction?.probabilites?.[cls]||0)*100)|number:'1.0-0' }}%
            </span>
          </div>
        </div>
        <div class="text-[9px] text-muted-foreground leading-tight">{{ r.prediction?.recommandation?.action }}</div>
      </div>
    </div>
    <div class="text-[9px] text-muted-foreground text-center">🧠 XGBoost · Dataset NHS · F1-Macro 94.2% · 17 features par service</div>
  </div>

  <!-- ONGLETS -->
  <div class="bg-card border-b px-6 flex items-center gap-1 overflow-x-auto">
    <button *ngIf="!isChefDeService()" (click)="activeTab.set('hospital')"
            class="px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5"
            [style.borderColor]="activeTab()==='hospital'?PRIMARY:'transparent'"
            [style.color]="activeTab()==='hospital'?PRIMARY:'var(--muted-foreground)'">
      <lucide-icon name="layout-grid" class="w-3.5 h-3.5"></lucide-icon>Hôpital global
    </button>
    <button *ngFor="let svc of filteredServicesKpis()" (click)="activeTab.set(svc.service_name)"
            class="px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5"
            [style.borderColor]="activeTab()===svc.service_name?PRIMARY:'transparent'"
            [style.color]="activeTab()===svc.service_name?PRIMARY:'var(--muted-foreground)'">
      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" [style.backgroundColor]="mlSvcColor(svc.service_name)"></span>
      {{ svc.service_name }}
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-5">
  <div class="max-w-6xl mx-auto space-y-5">

    <!-- VUE HÔPITAL GLOBAL -->
    <ng-container *ngIf="activeTab()==='hospital' && !isChefDeService()">
      <div>
        <div class="flex items-center gap-2 px-1 mb-3">
          <span class="w-1.5 h-4 rounded-full" [style.backgroundColor]="PRIMARY"></span>
          <span class="text-xs font-bold text-foreground uppercase tracking-wider">KPIs APRÈS simulation — Hôpital global</span>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <button *ngFor="let cat of categories" (click)="selectCategory(cat.key)"
                  class="rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md"
                  [style.borderColor]="activeCategory()===cat.key?cat.color:cat.color+'30'"
                  [style.background]="activeCategory()===cat.key?cat.color+'10':'var(--card)'">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" [style.background]="cat.color+'20'">
                <lucide-icon [name]="cat.icon" class="w-4 h-4" [style.color]="cat.color"></lucide-icon>
              </div>
              <div><div class="text-xs font-bold text-foreground">{{ cat.label }}</div><div class="text-[9px] text-muted-foreground">{{ cat.sub }}</div></div>
            </div>
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let kpi of cat.kpis" class="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    [style.backgroundColor]="kpiTagColor(kpi)+'20'" [style.color]="kpiTagColor(kpi)">
                {{ kpi.label }}: {{ kpiAfterFmt(kpi) }}
              </span>
            </div>
            <div *ngIf="activeCategory()===cat.key" class="mt-2 text-[10px] font-bold" [style.color]="cat.color">▼ Détails ci-dessous</div>
          </button>
        </div>

        <div *ngIf="activeCategory()==='SSI'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#00BCD430;background:#00BCD405"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#00BCD4"></lucide-icon><span class="text-sm font-bold" style="color:#00BCD4">A — Flux Patients</span></div></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A2 — Durée Moy. de Séjour</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('A2_dms'),true,4.5,7)+'18'" [style.color]="kpiColor(kpiAfter('A2_dms'),true,4.5,7)">{{ kpiStatus(kpiAfter('A2_dms'),true,4.5,7) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiAfter('A2_dms'),true,4.5,7)">{{ kpiAfter('A2_dms') | number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">jours</span></div><div class="flex items-center gap-2"><span class="text-[10px] text-muted-foreground w-12">Avant</span><div class="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full bg-gray-400" [style.width.%]="barPct(kpiBefore('A2_dms'),14)"></div></div><span class="text-[10px] text-muted-foreground w-10 text-right">{{ kpiBefore('A2_dms') | number:'1.0-1' }}j</span></div><div class="flex items-center gap-2 mt-1"><span class="text-[10px] font-semibold w-12" style="color:#00BCD4">Après</span><div class="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div class="h-full rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('A2_dms'),true,4.5,7)" [style.width.%]="barPct(kpiAfter('A2_dms'),14)"></div></div><span class="text-[10px] font-bold w-10 text-right" [style.color]="kpiColor(kpiAfter('A2_dms'),true,4.5,7)">{{ kpiAfter('A2_dms') | number:'1.0-1' }}j</span></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A4 — Temps d'Attente</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('A4_temps_attente'),true,20,40)+'18'" [style.color]="kpiColor(kpiAfter('A4_temps_attente'),true,20,40)">{{ kpiStatus(kpiAfter('A4_temps_attente'),true,20,40) }}</span></div><div class="flex justify-center mb-2"><div class="relative" style="width:130px;height:72px"><svg viewBox="0 0 130 72" class="w-full h-full"><path d="M 10 67 A 55 55 0 0 1 120 67" fill="none" stroke="#e2e8f0" stroke-width="9" stroke-linecap="round"/><path d="M 10 67 A 55 55 0 0 1 120 67" fill="none" [attr.stroke]="kpiColor(kpiAfter('A4_temps_attente'),true,20,40)" stroke-width="9" stroke-linecap="round" stroke-dasharray="173" [attr.stroke-dashoffset]="173-(173*Math.min(kpiAfter('A4_temps_attente'),60)/60)"/><text x="65" y="58" text-anchor="middle" font-size="16" font-weight="700" [attr.fill]="kpiColor(kpiAfter('A4_temps_attente'),true,20,40)">{{ kpiAfter('A4_temps_attente') | number:'1.0-0' }}</text><text x="65" y="70" text-anchor="middle" font-size="7" fill="#90A4AE">minutes · avant: {{ kpiBefore('A4_temps_attente') | number:'1.0-0' }}min</text></svg></div></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A8 — Taux Lits Vacants</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('A8_lits_vacants'),false,15,8)+'18'" [style.color]="kpiColor(kpiAfter('A8_lits_vacants'),false,15,8)">{{ kpiStatus(kpiAfter('A8_lits_vacants'),false,15,8) }}</span></div><div class="flex items-center gap-4"><div class="relative flex-shrink-0" style="width:75px;height:75px"><svg viewBox="0 0 80 80" class="w-full h-full -rotate-90"><circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="10"/><circle cx="40" cy="40" r="30" fill="none" [attr.stroke]="kpiColor(kpiAfter('A8_lits_vacants'),false,15,8)" stroke-width="10" stroke-linecap="round" stroke-dasharray="188" [attr.stroke-dashoffset]="188-(188*kpiAfter('A8_lits_vacants')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-base font-bold" [style.color]="kpiColor(kpiAfter('A8_lits_vacants'),false,15,8)">{{ kpiAfter('A8_lits_vacants') | number:'1.0-0' }}%</span></div></div><div class="flex-1 space-y-1 text-xs"><div class="flex justify-between"><span class="text-muted-foreground">Vacants après</span><span class="font-bold" [style.color]="kpiColor(kpiAfter('A8_lits_vacants'),false,15,8)">{{ kpiAfter('A8_lits_vacants') | number:'1.0-0' }}%</span></div><div class="flex justify-between"><span class="text-muted-foreground">Avant</span><span class="text-muted-foreground">{{ kpiBefore('A8_lits_vacants') | number:'1.0-0' }}%</span></div></div></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="arrow-right" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold text-foreground">A9 — Taux de Transfert</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('A9_taux_transfert'),true,2,5)+'18'" [style.color]="kpiColor(kpiAfter('A9_taux_transfert'),true,2,5)">{{ kpiStatus(kpiAfter('A9_taux_transfert'),true,2,5) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiAfter('A9_taux_transfert'),true,2,5)">{{ kpiAfter('A9_taux_transfert') | number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div><div class="relative h-3 rounded-full overflow-hidden bg-muted"><div class="absolute h-full rounded-full" [style.width.%]="Math.min(kpiAfter('A9_taux_transfert')/15*100,100)" [style.backgroundColor]="kpiColor(kpiAfter('A9_taux_transfert'),true,2,5)"></div></div></div>
          </div>
        </div>

        <div *ngIf="activeCategory()==='IIP'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#E5393530;background:#E5393505"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#E53935"></lucide-icon><span class="text-sm font-bold" style="color:#E53935">C — Qualité Clinique</span></div></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C2 — Taux d'Occupation</span></div><div class="flex justify-center mb-2"><div class="relative" style="width:90px;height:90px"><svg viewBox="0 0 90 90" class="w-full h-full -rotate-90"><circle cx="45" cy="45" r="35" fill="none" stroke="#e2e8f0" stroke-width="11"/><circle cx="45" cy="45" r="35" fill="none" [attr.stroke]="kpiColor(kpiAfter('C2_occupation'),true,85,92)" stroke-width="11" stroke-linecap="round" stroke-dasharray="220" [attr.stroke-dashoffset]="220-(220*kpiAfter('C2_occupation')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-lg font-bold" [style.color]="kpiColor(kpiAfter('C2_occupation'),true,85,92)">{{ kpiAfter('C2_occupation') | number:'1.0-0' }}%</span><span class="text-[8px] text-muted-foreground">avant: {{ kpiBefore('C2_occupation') | number:'1.0-0' }}%</span></div></div></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="heart" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C3 — Mortalité</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('C3_mortalite'),true,2,4)+'18'" [style.color]="kpiColor(kpiAfter('C3_mortalite'),true,2,4)">{{ kpiStatus(kpiAfter('C3_mortalite'),true,2,4) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiAfter('C3_mortalite'),true,2,4)">{{ kpiAfter('C3_mortalite') | number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="alert-triangle" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold text-foreground">C4 — Infections</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(kpiAfter('C4_infection'),true,1,3)+'18'" [style.color]="kpiColor(kpiAfter('C4_infection'),true,1,3)">{{ kpiStatus(kpiAfter('C4_infection'),true,1,3) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(kpiAfter('C4_infection'),true,1,3)">{{ kpiAfter('C4_infection') | number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
          </div>
        </div>

        <div *ngIf="activeCategory()==='ESI'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#43A04730;background:#43A04705"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#43A047"></lucide-icon><span class="text-sm font-bold" style="color:#43A047">B — Indicateurs Financiers</span></div></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-5 col-span-2"><div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="trending-up" class="w-4 h-4" style="color:#43A047"></lucide-icon>B1 — Coût moyen des soins</div><div class="text-center mb-3"><span class="text-3xl font-bold" style="color:#43A047">{{ formatDA(kpiAfter('B1_cout_soins')) }}</span><span class="text-sm text-muted-foreground ml-1">DA/patient</span></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="text-sm font-bold text-foreground mb-2">B4 — Coût/lit/jour</div><div class="text-2xl font-bold mb-1" style="color:#43A047">{{ formatDA(kpiAfter('B4_cout_lit')) }}</div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="text-sm font-bold text-foreground mb-2">B7 — Personnel</div><div class="text-2xl font-bold mb-1" style="color:#43A047">{{ formatM(kpiAfter('B7_cout_personnel')) }}</div><div class="text-[10px] text-muted-foreground">MDA/mois</div></div>
          </div>
        </div>

        <div *ngIf="activeCategory()==='TI'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#FB8C0030;background:#FB8C0005"><div class="flex items-center gap-2"><lucide-icon name="alert-circle" class="w-4 h-4" style="color:#FB8C00"></lucide-icon><span class="text-sm font-bold" style="color:#FB8C00">D — Infrastructure Technique</span></div></div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="stethoscope" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D5 — Équipements</div><div class="flex justify-center"><div class="relative" style="width:80px;height:80px"><svg viewBox="0 0 80 80" class="w-full h-full -rotate-90"><circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="10"/><circle cx="40" cy="40" r="30" fill="none" [attr.stroke]="kpiColor(kpiAfter('D5_distribution_eq'),false,90,70)" stroke-width="10" stroke-linecap="round" stroke-dasharray="188" [attr.stroke-dashoffset]="188-(188*kpiAfter('D5_distribution_eq')/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-base font-bold" [style.color]="kpiColor(kpiAfter('D5_distribution_eq'),false,90,70)">{{ kpiAfter('D5_distribution_eq') | number:'1.0-0' }}</span><span class="text-[8px] text-muted-foreground">/100</span></div></div></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="trash-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D11 — DASRI</div><div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(kpiAfter('D11_gestion_dechets'),false,80,60)">{{ kpiAfter('D11_gestion_dechets') | number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div></div>
            <div class="bg-card rounded-2xl border shadow-sm p-4"><div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="activity" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D13 — Qualité Air</div><div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(kpiAfter('D13_air_interieur'),false,75,50)">{{ kpiAfter('D13_air_interieur') | number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div></div>
          </div>
        </div>
      </div>

      <!-- TABLEAU COMPARATIF -->
      <div>
        <div class="flex items-center gap-2 px-1 mb-3">
          <span class="w-1.5 h-4 rounded-full" [style.backgroundColor]="PRIMARY"></span>
          <span class="text-xs font-bold text-foreground uppercase tracking-wider">Tableau comparatif — KPIs Hôpital global</span>
        </div>
        <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <table class="w-full text-xs">
            <thead><tr class="border-b border-border" style="background:rgba(0,188,212,0.06)"><th class="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">KPI</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Avant</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Après</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Évolution</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of comparisonRows(); let i=index" class="border-b border-border/40 hover:bg-muted/20" [style.backgroundColor]="i%2===0?'transparent':'rgba(0,0,0,0.015)'">
                <td class="px-4 py-2.5 font-medium text-foreground">{{ row.label }}</td>
                <td class="px-4 py-2.5 text-center text-muted-foreground">{{ row.before | number:'1.0-1' }} {{ row.unit }}</td>
                <td class="px-4 py-2.5 text-center font-bold" [style.color]="kpiColor(row.after, row.lib, row.ok, row.warn)">{{ row.after | number:'1.0-1' }} {{ row.unit }}</td>
                <td class="px-4 py-2.5 text-center"><span class="font-bold" [style.color]="kpiEvolution(row.before, row.after, row.lib).improved ? GREEN : RED">{{ evolutionAbsolute(row.before, row.after, row.unit) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>

    <!-- VUE SERVICE -->
    <ng-container *ngFor="let svc of filteredServicesKpis()">
      <div *ngIf="activeTab()===svc.service_name" class="space-y-4">
        <div class="rounded-2xl border shadow-sm p-4 flex items-center gap-4"
             [style.borderColor]="mlSvcColor(svc.service_name)+'40'"
             [style.backgroundColor]="mlSvcColor(svc.service_name)+'06'">
          <div class="w-3 h-3 rounded-full flex-shrink-0"
               [style.backgroundColor]="mlSvcColor(svc.service_name)"></div>
          <div class="flex-1">
            <div class="font-bold text-foreground">{{ svc.service_name }}</div>
            <div class="text-xs text-muted-foreground">Prédiction ML post-simulation · Comparaison AVANT / APRÈS</div>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                [style.backgroundColor]="mlSvcColor(svc.service_name)+'18'"
                [style.color]="mlSvcColor(svc.service_name)">
            {{ mlLoading() ? '…' : mlSvcLabel(svc.service_name) }}
            <span *ngIf="!mlLoading() && mlResults().length" class="ml-1 opacity-70 font-normal text-[10px]">{{ mlSvcConfiance(svc.service_name) }}%</span>
          </span>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button (click)="selectSvcCategory(svc.service_name,'SSI')" class="rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md" [style.borderColor]="activeSvcCategory()===svc.service_name+'SSI'?'#00BCD4':'#00BCD430'" [style.background]="activeSvcCategory()===svc.service_name+'SSI'?'#00BCD410':'var(--card)'">
            <div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="users" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><div><div class="text-xs font-bold text-foreground">A — Flux Patients</div></div></div>
            <div class="flex flex-wrap gap-1"><span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40)+'20'" [style.color]="kpiColor(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40)">A4: {{ (svc.kpis?.SSI?.A4_temps_attente||0)|number:'1.0-0' }}min</span></div>
            <div *ngIf="activeSvcCategory()===svc.service_name+'SSI'" class="mt-2 text-[10px] font-bold" style="color:#00BCD4">▼ Détails</div>
          </button>
          <button (click)="selectSvcCategory(svc.service_name,'IIP')" class="rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md" [style.borderColor]="activeSvcCategory()===svc.service_name+'IIP'?'#E53935':'#E5393530'" [style.background]="activeSvcCategory()===svc.service_name+'IIP'?'#E5393510':'var(--card)'">
            <div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="heart-pulse" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><div><div class="text-xs font-bold text-foreground">C — Qualité Clinique</div></div></div>
            <div class="flex flex-wrap gap-1"><span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(svc.kpis?.IIP?.C2_occupation||0,true,85,92)+'20'" [style.color]="kpiColor(svc.kpis?.IIP?.C2_occupation||0,true,85,92)">C2: {{ (svc.kpis?.IIP?.C2_occupation||0)|number:'1.0-0' }}%</span><span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" [style.backgroundColor]="kpiColor(svc.kpis?.IIP?.C3_mortalite||0,true,2,4)+'20'" [style.color]="kpiColor(svc.kpis?.IIP?.C3_mortalite||0,true,2,4)">C3: {{ (svc.kpis?.IIP?.C3_mortalite||0)|number:'1.0-1' }}%</span></div>
            <div *ngIf="activeSvcCategory()===svc.service_name+'IIP'" class="mt-2 text-[10px] font-bold" style="color:#E53935">▼ Détails</div>
          </button>
          <button (click)="selectSvcCategory(svc.service_name,'ESI')" class="rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md" [style.borderColor]="activeSvcCategory()===svc.service_name+'ESI'?'#43A047':'#43A04730'" [style.background]="activeSvcCategory()===svc.service_name+'ESI'?'#43A04710':'var(--card)'">
            <div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#43A04720"><lucide-icon name="trending-up" class="w-3.5 h-3.5" style="color:#43A047"></lucide-icon></div><div><div class="text-xs font-bold text-foreground">B — Finances</div></div></div>
            <div *ngIf="activeSvcCategory()===svc.service_name+'ESI'" class="mt-2 text-[10px] font-bold" style="color:#43A047">▼ Détails</div>
          </button>
          <button (click)="selectSvcCategory(svc.service_name,'TI')" class="rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md" [style.borderColor]="activeSvcCategory()===svc.service_name+'TI'?'#FB8C00':'#FB8C0030'" [style.background]="activeSvcCategory()===svc.service_name+'TI'?'#FB8C0010':'var(--card)'">
            <div class="flex items-center gap-2 mb-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#FB8C0020"><lucide-icon name="settings-2" class="w-3.5 h-3.5" style="color:#FB8C00"></lucide-icon></div><div><div class="text-xs font-bold text-foreground">D — Infrastructure</div></div></div>
            <div *ngIf="activeSvcCategory()===svc.service_name+'TI'" class="mt-2 text-[10px] font-bold" style="color:#FB8C00">▼ Détails</div>
          </button>
        </div>

        <div *ngIf="activeSvcCategory()===svc.service_name+'SSI'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold">A2 — DMS</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.SSI?.A2_dms||0,true,4.5,7)+'18'" [style.color]="kpiColor(svc.kpis?.SSI?.A2_dms||0,true,4.5,7)">{{ kpiStatus(svc.kpis?.SSI?.A2_dms||0,true,4.5,7) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.SSI?.A2_dms||0,true,4.5,7)">{{ (svc.kpis?.SSI?.A2_dms||0)|number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">jours</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="clock" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold">A4 — Temps d'Attente</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40)+'18'" [style.color]="kpiColor(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40)">{{ kpiStatus(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.SSI?.A4_temps_attente||0,true,20,40)">{{ (svc.kpis?.SSI?.A4_temps_attente||0)|number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">min</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold">A8 — Lits Vacants</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.SSI?.A8_lits_vacants||0,false,15,8)+'18'" [style.color]="kpiColor(svc.kpis?.SSI?.A8_lits_vacants||0,false,15,8)">{{ kpiStatus(svc.kpis?.SSI?.A8_lits_vacants||0,false,15,8) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.SSI?.A8_lits_vacants||0,false,15,8)">{{ (svc.kpis?.SSI?.A8_lits_vacants||0)|number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#00BCD420"><lucide-icon name="arrow-right" class="w-3.5 h-3.5" style="color:#00BCD4"></lucide-icon></div><span class="text-sm font-bold">A9 — Transferts</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.SSI?.A9_taux_transfert||0,true,2,5)+'18'" [style.color]="kpiColor(svc.kpis?.SSI?.A9_taux_transfert||0,true,2,5)">{{ kpiStatus(svc.kpis?.SSI?.A9_taux_transfert||0,true,2,5) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.SSI?.A9_taux_transfert||0,true,2,5)">{{ (svc.kpis?.SSI?.A9_taux_transfert||0)|number:'1.0-1' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
        </div>

        <div *ngIf="activeSvcCategory()===svc.service_name+'IIP'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="bed" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold">C2 — Occupation</span></div><div class="flex justify-center"><div class="relative" style="width:90px;height:90px"><svg viewBox="0 0 90 90" class="w-full h-full -rotate-90"><circle cx="45" cy="45" r="35" fill="none" stroke="#e2e8f0" stroke-width="11"/><circle cx="45" cy="45" r="35" fill="none" [attr.stroke]="kpiColor(svc.kpis?.IIP?.C2_occupation||0,true,85,92)" stroke-width="11" stroke-linecap="round" stroke-dasharray="220" [attr.stroke-dashoffset]="220-(220*(svc.kpis?.IIP?.C2_occupation||0)/100)"/></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-lg font-bold" [style.color]="kpiColor(svc.kpis?.IIP?.C2_occupation||0,true,85,92)">{{ (svc.kpis?.IIP?.C2_occupation||0)|number:'1.0-0' }}%</span></div></div></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="heart" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold">C3 — Mortalité</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.IIP?.C3_mortalite||0,true,2,4)+'18'" [style.color]="kpiColor(svc.kpis?.IIP?.C3_mortalite||0,true,2,4)">{{ kpiStatus(svc.kpis?.IIP?.C3_mortalite||0,true,2,4) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.IIP?.C3_mortalite||0,true,2,4)">{{ (svc.kpis?.IIP?.C3_mortalite||0)|number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
          <div class="bg-card rounded-2xl border shadow-sm p-5"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#E5393520"><lucide-icon name="alert-triangle" class="w-3.5 h-3.5" style="color:#E53935"></lucide-icon></div><span class="text-sm font-bold">C4 — Infections</span></div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [style.backgroundColor]="kpiColor(svc.kpis?.IIP?.C4_infection||0,true,1,3)+'18'" [style.color]="kpiColor(svc.kpis?.IIP?.C4_infection||0,true,1,3)">{{ kpiStatus(svc.kpis?.IIP?.C4_infection||0,true,1,3) }}</span></div><div class="text-center mb-3"><span class="text-4xl font-bold" [style.color]="kpiColor(svc.kpis?.IIP?.C4_infection||0,true,1,3)">{{ (svc.kpis?.IIP?.C4_infection||0)|number:'1.0-2' }}</span><span class="text-sm text-muted-foreground ml-1">%</span></div></div>
        </div>

        <!-- ESI SERVICE -->
        <div *ngIf="activeSvcCategory()===svc.service_name+'ESI'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#43A04730;background:#43A04705">
            <div class="flex items-center gap-2"><lucide-icon name="trending-up" class="w-4 h-4" style="color:#43A047"></lucide-icon><span class="text-sm font-bold" style="color:#43A047">B — Indicateurs Financiers — {{ svc.service_name }}</span></div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-5 col-span-2">
              <div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="trending-up" class="w-4 h-4" style="color:#43A047"></lucide-icon>B1 — Coût moyen des soins</div>
              <div class="text-center mb-3"><span class="text-3xl font-bold" style="color:#43A047">{{ formatDA(svc.kpis?.ESI?.B1_cout_soins || 0) }}</span><span class="text-sm text-muted-foreground ml-1">DA/patient</span></div>
            </div>
            <div class="bg-card rounded-2xl border shadow-sm p-5">
              <div class="text-sm font-bold text-foreground mb-2">B4 — Coût/lit/jour</div>
              <div class="text-2xl font-bold" style="color:#43A047">{{ formatDA(svc.kpis?.ESI?.B4_cout_lit || 0) }}</div>
            </div>
            <div class="bg-card rounded-2xl border shadow-sm p-5">
              <div class="text-sm font-bold text-foreground mb-2">B7 — Personnel</div>
              <div class="text-2xl font-bold" style="color:#43A047">{{ formatM(svc.kpis?.ESI?.B7_cout_personnel || 0) }}</div>
              <div class="text-[10px] text-muted-foreground">MDA/mois</div>
            </div>
          </div>
        </div>

        <!-- TI SERVICE -->
        <div *ngIf="activeSvcCategory()===svc.service_name+'TI'" class="space-y-4">
          <div class="rounded-2xl border-2 p-3" style="border-color:#FB8C0030;background:#FB8C0005">
            <div class="flex items-center gap-2"><lucide-icon name="settings-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon><span class="text-sm font-bold" style="color:#FB8C00">D — Infrastructure Technique — {{ svc.service_name }}</span></div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-card rounded-2xl border shadow-sm p-4">
              <div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="stethoscope" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D5 — Équipements</div>
              <div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(svc.kpis?.TI?.D5_distribution_eq||0,false,90,70)">{{ (svc.kpis?.TI?.D5_distribution_eq||0)|number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div>
            </div>
            <div class="bg-card rounded-2xl border shadow-sm p-4">
              <div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="trash-2" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D11 — DASRI</div>
              <div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(svc.kpis?.TI?.D11_gestion_dechets||0,false,80,60)">{{ (svc.kpis?.TI?.D11_gestion_dechets||0)|number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div>
            </div>
            <div class="bg-card rounded-2xl border shadow-sm p-4">
              <div class="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><lucide-icon name="activity" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>D13 — Qualité Air</div>
              <div class="text-center"><span class="text-3xl font-bold" [style.color]="kpiColor(svc.kpis?.TI?.D13_air_interieur||0,false,75,50)">{{ (svc.kpis?.TI?.D13_air_interieur||0)|number:'1.0-0' }}</span><span class="text-sm text-muted-foreground ml-1">/100</span></div>
            </div>
          </div>
        </div>

        <!-- TABLEAU COMPARATIF SERVICE -->
        <div>
          <div class="flex items-center gap-2 px-1 mb-3">
            <span class="w-1.5 h-4 rounded-full" [style.backgroundColor]="mlSvcColor(svc.service_name)"></span>
            <span class="text-xs font-bold text-foreground uppercase tracking-wider">Tableau comparatif — {{ svc.service_name }}</span>
          </div>
          <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <table class="w-full text-xs">
              <thead><tr class="border-b border-border" [style.background]="mlSvcColor(svc.service_name)+'08'"><th class="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">KPI</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Avant</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Après</th><th class="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Évolution</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of svcComparisonRows(svc); let i=index" class="border-b border-border/40 hover:bg-muted/20" [style.backgroundColor]="i%2===0?'transparent':'rgba(0,0,0,0.015)'">
                  <td class="px-4 py-2.5 font-medium text-foreground">{{ row.label }}</td>
                  <td class="px-4 py-2.5 text-center text-muted-foreground">{{ row.before | number:'1.0-1' }} {{ row.unit }}</td>
                  <td class="px-4 py-2.5 text-center font-bold" [style.color]="kpiColor(row.after, row.lib, row.ok, row.warn)">{{ row.after | number:'1.0-1' }} {{ row.unit }}</td>
                  <td class="px-4 py-2.5 text-center"><span class="font-bold" [style.color]="kpiEvolution(row.before, row.after, row.lib).improved ? GREEN : (row.after === row.before ? 'var(--muted-foreground)' : RED)">{{ evolutionAbsolute(row.before, row.after, row.unit) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ACTIONS -->
    <div class="pb-6 pt-2">
      <div class="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <a routerLink="/simulation" class="px-4 py-2.5 rounded-xl border-2 border-border bg-card hover:bg-muted text-sm font-semibold text-foreground inline-flex items-center gap-2"><lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>Modifier</a>
        <button *ngIf="!isChefDeService() && (applyStatus()==='idle'||applyStatus()==='error')" (click)="startApply()" class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'"><lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>Appliquer au système</button>
        <button *ngIf="applyStatus()==='loading'" disabled class="px-5 py-2.5 rounded-xl text-white font-semibold opacity-70 flex items-center gap-2" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'"><lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>Application…</button>
        <div *ngIf="applyStatus()==='success'" class="px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold" [style.backgroundColor]="GREEN+'15'" [style.color]="GREEN"><lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>Appliqué !</div>
      </div>
    </div>

  </div>
  </div>

  <!-- MODAL CONFIRMATION -->
  <div *ngIf="applyStatus()==='confirming'" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" (click)="cancelApply()">
    <div class="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
      <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-2xl flex items-center justify-center" [style.background]="'linear-gradient(135deg,'+PRIMARY+'20,'+PRIMARY_DARK+'20)'"><lucide-icon name="check-circle" class="w-5 h-5" [style.color]="PRIMARY"></lucide-icon></div><div><h3 class="font-bold text-foreground">Confirmer l'application</h3><p class="text-xs text-muted-foreground">Mise à jour des ressources réelles.</p></div></div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-muted/40 rounded-xl p-3 border"><div class="text-muted-foreground text-[11px]">Médecins</div><div class="font-bold text-foreground text-xl">{{ data()?.input?.target_doctors||0 }}</div></div>
        <div class="bg-muted/40 rounded-xl p-3 border"><div class="text-muted-foreground text-[11px]">Infirmiers</div><div class="font-bold text-foreground text-xl">{{ data()?.input?.target_nurses||0 }}</div></div>
        <div class="bg-muted/40 rounded-xl p-3 border"><div class="text-muted-foreground text-[11px]">Lits</div><div class="font-bold text-foreground text-xl">{{ data()?.input?.target_beds||0 }}</div></div>
      </div>
      <div class="flex gap-2 justify-end"><button (click)="cancelApply()" class="px-4 py-2 text-sm rounded-xl border border-border bg-card hover:bg-muted font-medium">Annuler</button><button (click)="confirmApply()" class="px-5 py-2 text-sm rounded-xl text-white font-semibold flex items-center gap-2" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'"><lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>Confirmer</button></div>
    </div>
  </div>
</div>
</ng-container>

<ng-template #empty>
  <div class="flex flex-col h-full bg-background items-center justify-center p-6">
    <div class="bg-card rounded-2xl border shadow-sm p-10 text-center max-w-md">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" [style.background]="'linear-gradient(135deg,'+PRIMARY+'15,'+PRIMARY_DARK+'15)'"><lucide-icon name="brain" class="w-8 h-8" [style.color]="PRIMARY"></lucide-icon></div>
      <div class="font-bold text-foreground text-xl mb-1">Aucun résultat disponible</div>
      <div class="text-sm text-muted-foreground mb-5">Lancez d'abord une simulation.</div>
      <a routerLink="/simulation" class="px-5 py-2.5 rounded-xl text-white font-semibold shadow-md inline-block" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'">Centre de simulation</a>
    </div>
  </div>
</ng-template>
  `,
})
export class SimulationResultComponent implements OnInit, OnDestroy {
  private store  = inject(SimulationStoreService);
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private http   = inject(HttpClient);

  readonly Math = Math;
  readonly PRIMARY = PRIMARY; readonly PRIMARY_DARK = PRIMARY_DARK;
  readonly GREEN = GREEN; readonly ORANGE = ORANGE; readonly RED = RED;

  data              = signal<any>(null);
  applyStatus       = signal<ApplyStatus>('idle');
  activeTab         = signal<string>('hospital');
  activeCategory    = signal<KpiCategory>(null);
  activeSvcCategory = signal<string>('');
  anim              = signal<any[]>([]);
  private animInterval: any = null;

  mlLoading    = signal<boolean>(false);
  mlResults    = signal<any[]>([]);
  mlConfiance  = signal<number>(0);
  mlPanelOpen  = signal<boolean>(false);

  readonly categories: any[] = [
    { key:'SSI', label:'Flux Patients',    sub:'Sociaux & flux',       icon:'users',       color:'#00BCD4', kpis:[{key:'A4_temps_attente',label:'A4',lib:true,ok:20,warn:40,fmt:'min'},{key:'A9_taux_transfert',label:'A9',lib:true,ok:2,warn:5,fmt:'%'}]},
    { key:'IIP', label:'Qualité Clinique', sub:'Indicateurs internes', icon:'heart-pulse', color:'#E53935', kpis:[{key:'C2_occupation',label:'C2',lib:true,ok:85,warn:92,fmt:'%'},{key:'C3_mortalite',label:'C3',lib:true,ok:2,warn:4,fmt:'%'},{key:'C4_infection',label:'C4',lib:true,ok:1,warn:3,fmt:'%'}]},
    { key:'ESI', label:'Finances',         sub:'Indicateurs économiques',icon:'trending-up', color:'#43A047', kpis:[{key:'B1_cout_soins',label:'B1',lib:false,ok:0,warn:0,fmt:'DA'}]},
    { key:'TI',  label:'Infrastructure',   sub:'Technique & env.',     icon:'settings-2',  color:'#FB8C00', kpis:[{key:'D5_distribution_eq',label:'D5',lib:false,ok:90,warn:70,fmt:'/100'},{key:'D11_gestion_dechets',label:'D11',lib:false,ok:80,warn:60,fmt:'/100'}]},
  ];

  ngOnInit() {
    this.data.set(this.store.get());
    this.initAnimation();
    if (this.isChefDeService()) {
      const svcs = this.filteredServicesKpis();
      if (svcs.length > 0) this.activeTab.set(svcs[0].service_name);
    }
    // ML lancé automatiquement dès le chargement
    setTimeout(() => this.runMlDiagnostic(), 500);
  }
  ngOnDestroy() { this.stopAnim(); }
  private stopAnim() { if (this.animInterval) { clearInterval(this.animInterval); this.animInterval = null; } }

  isChefDeService(): boolean { return this.auth.currentUser()?.role === 'chef_service'; }

  filteredServicesKpis(): any[] {
    const all = this.servicesKpis();
    const user = this.auth.currentUser();
    if (user?.role === 'chef_service' && user.service_id) {
      const filtered = all.filter((svc: any) => svc.service_id === user.service_id);
      return filtered.length > 0 ? filtered : all.slice(0, 1);
    }
    return all;
  }

  selectCategory(cat: KpiCategory) { this.activeCategory.set(this.activeCategory() === cat ? null : cat); }
  selectSvcCategory(svcName: string, cat: string) {
    const key = svcName + cat;
    this.activeSvcCategory.set(this.activeSvcCategory() === key ? '' : key);
  }

  kpiAfter(key: string): number {
    const d = this.data()?.result;
    const kpis = d?.kpis?.after ?? d?.kpis_after ?? null;
    if (!kpis) return 0;
    for (const cat of ['SSI','IIP','ESI','TI']) { if (kpis[cat]?.[key] !== undefined) return kpis[cat][key]; }
    return 0;
  }
  kpiBefore(key: string): number {
    const d = this.data()?.result;
    const kpis = d?.kpis?.before ?? d?.kpis_before ?? null;
    if (!kpis) return 0;
    for (const cat of ['SSI','IIP','ESI','TI']) { if (kpis[cat]?.[key] !== undefined) return kpis[cat][key]; }
    return 0;
  }
  kpiAfterFmt(kpi: any): string { const v = this.kpiAfter(kpi.key); if (kpi.fmt === 'DA') return this.formatDA(v); return (v | 0) + kpi.fmt; }
  kpiTagColor(kpi: any): string { if (kpi.ok === 0) return '#43A047'; return this.kpiColor(this.kpiAfter(kpi.key), kpi.lib, kpi.ok, kpi.warn); }
  kpiColor(v: number, lib: boolean, okT: number, warnT: number): string { if (lib) return v <= okT ? GREEN : v <= warnT ? ORANGE : RED; return v >= okT ? GREEN : v >= warnT ? ORANGE : RED; }
  kpiStatus(v: number, lib: boolean, okT: number, warnT: number): string { const c = this.kpiColor(v, lib, okT, warnT); return c === GREEN ? 'Dans la norme' : c === ORANGE ? 'Attention' : 'Critique'; }

  servicesKpis(): any[] { const r = this.data()?.result; return r?.services_kpis ?? r?.servicesKpis ?? []; }
  svcStatutColor(s: string): string { return s === 'critique' ? RED : s === 'attention' ? ORANGE : GREEN; }

  comparisonRows(): any[] {
    return [
      { label:'A2 — Durée Moy. Séjour', unit:'j',    before:this.kpiBefore('A2_dms'),             after:this.kpiAfter('A2_dms'),             lib:true,  ok:4.5, warn:7  },
      { label:'A4 — Temps d\'Attente',  unit:'min',  before:this.kpiBefore('A4_temps_attente'),    after:this.kpiAfter('A4_temps_attente'),    lib:true,  ok:20,  warn:40 },
      { label:'A8 — Lits Vacants',      unit:'%',    before:this.kpiBefore('A8_lits_vacants'),     after:this.kpiAfter('A8_lits_vacants'),     lib:false, ok:15,  warn:8  },
      { label:'A9 — Taux Transfert',    unit:'%',    before:this.kpiBefore('A9_taux_transfert'),   after:this.kpiAfter('A9_taux_transfert'),   lib:true,  ok:2,   warn:5  },
      { label:'C2 — Occupation',        unit:'%',    before:this.kpiBefore('C2_occupation'),       after:this.kpiAfter('C2_occupation'),       lib:true,  ok:85,  warn:92 },
      { label:'C3 — Mortalité',         unit:'%',    before:this.kpiBefore('C3_mortalite'),        after:this.kpiAfter('C3_mortalite'),        lib:true,  ok:2,   warn:4  },
      { label:'C4 — Infections',        unit:'%',    before:this.kpiBefore('C4_infection'),        after:this.kpiAfter('C4_infection'),        lib:true,  ok:1,   warn:3  },
      { label:'D5 — Équipements',       unit:'/100', before:this.kpiBefore('D5_distribution_eq'),  after:this.kpiAfter('D5_distribution_eq'),  lib:false, ok:90,  warn:70 },
      { label:'D11 — DASRI',            unit:'/100', before:this.kpiBefore('D11_gestion_dechets'), after:this.kpiAfter('D11_gestion_dechets'), lib:false, ok:80,  warn:60 },
    ];
  }

  svcComparisonRows(svc: any): any[] {
    const k  = svc.kpis || {};
    const kb = svc.kpis_before || null;

    // ✅ Chercher le snapshot KPIs réels (BDD) depuis le payload input
    const origSvcs = this.data()?.input?.original_services || [];
    const origSvc  = origSvcs.find((os: any) =>
      String(os.id) === String(svc.service_id) ||
      String(os.name) === String(svc.service_name)
    );
    const snap = origSvc?.original_kpis || null;

    // Priorité : kpis_before Flask → snapshot BDD → global avant
    const b = (cat: string, key: string, fallback: string) =>
      kb?.[cat]?.[key] ??
      snap?.[cat]?.[key] ??
      this.kpiBefore(fallback);

    return [
      { label:'A2 — DMS',          unit:'j',   before:b('SSI','A2_dms','A2_dms'),                       after:k.SSI?.A2_dms??0,            lib:true,  ok:4.5, warn:7  },
      { label:'A4 — Attente',      unit:'min', before:b('SSI','A4_temps_attente','A4_temps_attente'),    after:k.SSI?.A4_temps_attente??0,  lib:true,  ok:20,  warn:40 },
      { label:'A8 — Lits Vacants', unit:'%',   before:b('SSI','A8_lits_vacants','A8_lits_vacants'),      after:k.SSI?.A8_lits_vacants??0,   lib:false, ok:15,  warn:8  },
      { label:'A9 — Transferts',   unit:'%',   before:b('SSI','A9_taux_transfert','A9_taux_transfert'),  after:k.SSI?.A9_taux_transfert??0, lib:true,  ok:2,   warn:5  },
      { label:'C2 — Occupation',   unit:'%',   before:b('IIP','C2_occupation','C2_occupation'),           after:k.IIP?.C2_occupation??0,     lib:true,  ok:85,  warn:92 },
      { label:'C3 — Mortalité',    unit:'%',   before:b('IIP','C3_mortalite','C3_mortalite'),             after:k.IIP?.C3_mortalite??0,      lib:true,  ok:2,   warn:4  },
      { label:'C4 — Infections',   unit:'%',   before:b('IIP','C4_infection','C4_infection'),             after:k.IIP?.C4_infection??0,      lib:true,  ok:1,   warn:3  },
    ];
  }

  evolutionAbsolute(before: number, after: number, unit: string): string {
    const diff = after - before;
    if (Math.abs(diff) < 0.05) return '→ 0 ' + unit;
    const val = Math.abs(diff) >= 10 ? Math.round(Math.abs(diff)).toString() : Math.abs(diff).toFixed(1);
    return (diff > 0 ? '↑ +' : '↓ -') + val + ' ' + unit;
  }
  kpiEvolution(before: number, after: number, lib: boolean): { pct: number; improved: boolean } {
    const improved = lib ? after <= before : after >= before;
    const pct = before === 0 ? 0 : Math.abs((after - before) / before) * 100;
    return { pct: Math.round(pct * 10) / 10, improved };
  }

  formatDA(v: number): string { return v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0); }
  formatM(v: number): string  { return (v / 1000000).toFixed(2); }
  barPct(val: number, max: number): number { return Math.min(100, Math.max(0, (val / max) * 100)); }

  // ── ML ─────────────────────────────────────────────────────
  runMlDiagnostic() {
    const svcs = this.servicesKpis();
    if (!svcs.length) return;
    this.mlLoading.set(true);
    const payload = {
      services: svcs.map((svc: any) => {
        const beds    = Math.max(1, svc.beds    || 1);
        const docs    = Math.max(1, svc.doctors || 1);
        const nurses  = svc.nurses   || 0;
        const patients= svc.patients || 0;
        const IIP = svc.kpis?.IIP || {};
        const SSI = svc.kpis?.SSI || {};
        const lambda = (this.data()?.input?.lambda_patients_jour || 200) / Math.max(svcs.length, 1);
        return {
          service_name: svc.service_name,
          kpis: {
            taux_mortalite              : IIP.C3_mortalite ?? 1.5,
            taux_occupation_lits        : Math.min((IIP.C2_occupation ?? (patients/beds*100)) / 100, 1),
            taux_infection_nosocomiale  : (IIP.C4_infection ?? 3.5) / 100,
            duree_moyenne_sejour_jours  : SSI.A2_dms ?? 4,
            temps_attente_median_min    : SSI.A4_temps_attente ?? 0,
            taux_transfert              : (SSI.A9_taux_transfert ?? 13) / 100,
            nombre_lits_disponibles     : Math.max(0, beds - patients),
            total_admissions            : Math.round(lambda * 365),
            nombre_medecins             : docs,
            nombre_infirmiers           : nurses,
            ratio_medecin_par_lit       : Math.round(docs   / beds * 1000) / 1000,
            ratio_infirmier_par_lit     : Math.round(nurses / beds * 1000) / 1000,
            ratio_infirmier_par_medecin : Math.round(nurses / docs * 1000) / 1000,
            annee                       : new Date().getFullYear(),
          }
        };
      })
    };
    this.http.post<any>(`${FLASK}/predict`, payload).subscribe({
      next: (res: any) => {
        const results = res.results || [];
        const avgConf = results.length ? results.reduce((s: number, r: any) => s + (r.prediction?.confiance || 0), 0) / results.length : 0;
        this.mlResults.set(results);
        this.mlConfiance.set(Math.round(avgConf * 100));
        this.mlLoading.set(false);
      },
      error: () => { this.mlLoading.set(false); }
    });
  }

  mlLabelColor(label: string): string {
    if (label === 'Critique') return '#E53935';
    if (label === 'Attention') return '#FB8C00';
    if (label === 'Normal')   return '#43A047';
    return '#90A4AE';
  }
  mlGlobalColor(): string {
    const hasCrit = this.mlResults().some((r: any) => r.prediction?.label === 'Critique');
    const hasAtt  = this.mlResults().some((r: any) => r.prediction?.label === 'Attention');
    if (hasCrit) return '#E53935';
    if (hasAtt)  return '#FB8C00';
    return '#43A047';
  }
  mlShortLabel(): string {
    // Pour un seul service (chef de service), afficher le label direct
    if (this.mlResults().length === 1) {
      return this.mlLabelEmoji(this.mlResults()[0].prediction?.label) + ' ' + (this.mlResults()[0].prediction?.label || 'ML').toUpperCase();
    }
    const hasCrit = this.mlResults().some((r: any) => r.prediction?.label === 'Critique');
    const hasAtt  = this.mlResults().some((r: any) => r.prediction?.label === 'Attention');
    if (hasCrit) return '🔴 CRITIQUE';
    if (hasAtt)  return '🟡 ATTENTION';
    return '🟢 NORMAL';
  }

  mlLabelEmoji(label: string): string {
    if (label === 'Critique') return '🔴';
    if (label === 'Attention') return '🟡';
    return '🟢';
  }
  mlGlobalLongLabel(): string {
    const hasCrit  = this.mlResults().some((r: any) => r.prediction?.label === 'Critique');
    const hasAtt   = this.mlResults().some((r: any) => r.prediction?.label === 'Attention');
    const single   = this.mlResults().length === 1;
    const svcName  = single ? this.mlResults()[0].service_name : '';
    if (hasCrit) return single
      ? `${svcName} — Intervention immédiate requise`
      : 'Intervention immédiate requise sur au moins un service';
    if (hasAtt)  return single
      ? `${svcName} — Surveillance renforcée recommandée`
      : 'Surveillance renforcée recommandée';
    return single
      ? `${svcName} — Situation normale après simulation`
      : 'Tous les services en situation normale après simulation';
  }
  mlGlobalEmoji(): string { const c = this.mlGlobalColor(); return c === '#E53935' ? '🔴' : c === '#FB8C00' ? '🟡' : '🟢'; }

  // Couleur et label ML par service (pour onglets et headers)
  mlSvcColor(svcName: string): string {
    const r = this.mlResults().find((r: any) => r.service_name === svcName);
    if (!r) return this.mlGlobalColor() || '#90A4AE';
    return this.mlLabelColor(r.prediction?.label);
  }
  mlSvcLabel(svcName: string): string {
    const r = this.mlResults().find((r: any) => r.service_name === svcName);
    if (!r) return '…';
    const label = r.prediction?.label || '';
    if (label === 'Critique') return 'CRITIQUE';
    if (label === 'Attention') return 'ATTENTION';
    if (label === 'Normal')   return 'NORMAL';
    return label.toUpperCase();
  }
  mlSvcConfiance(svcName: string): number {
    const r = this.mlResults().find((r: any) => r.service_name === svcName);
    return r ? Math.round((r.prediction?.confiance || 0) * 100) : 0;
  }

  startApply() { this.applyStatus.set('confirming'); }
  cancelApply() { this.applyStatus.set('idle'); }
  confirmApply() {
    const d = this.data(); if (!d?.input) return;
    this.applyStatus.set('loading');
    this.api.applyScenario(d.input.hospital_id, { doctors: d.input.target_doctors, nurses: d.input.target_nurses, beds: d.input.target_beds, scenario_name: d.input.scenario_name }).subscribe({
      next: () => this.applyStatus.set('success'),
      error: () => this.applyStatus.set('error'),
    });
  }

  private initAnimation() {
    const d = this.data(); const b = d?.result?.before; const a = d?.result?.after;
    if (!b || !a) return;
    const defs = [
      { label:"Attente", icon:'clock', unit:'min', before:this.kpiBefore('A4_temps_attente')||b.waiting_time_minutes||0, after:this.kpiAfter('A4_temps_attente')||a.waiting_time_minutes||0, lowerIsBetter:true, okT:20, warnT:40 },
      { label:'Lits',    icon:'bed',   unit:'%',   before:this.kpiBefore('C2_occupation')||b.bed_occupancy_rate||0,      after:this.kpiAfter('C2_occupation')||a.bed_occupancy_rate||0,      lowerIsBetter:true, okT:85, warnT:92 },
    ];
    let frame = 0;
    this.updateAnim(defs, 0);
    this.animInterval = setInterval(() => {
      frame++;
      const e = 1 - Math.pow(1 - Math.min(1, frame / 50), 3);
      this.updateAnim(defs, e);
      if (frame >= 50) this.stopAnim();
    }, 50);
  }
  private updateAnim(defs: any[], e: number) {
    this.anim.set(defs.map(k => {
      const val   = k.before + (k.after - k.before) * e;
      const color = this.kpiColor(val, k.lowerIsBetter, k.okT, k.warnT);
      const delta = k.lowerIsBetter ? ((k.before - k.after) / Math.max(k.before, 1)) * 100 : ((k.after - k.before) / Math.max(k.before, 1)) * 100;
      return { ...k, val, color, improved: delta >= 0, deltaStr: (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%' };
    }));
  }
}