import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { Hospital, Service, Equipment } from '../../shared/models';
import {
  DEFAULT_INPUT, runSimulation, BASE_TOTAL_STAFF,
  PRIMARY, PRIMARY_DARK, RED,
} from '../../shared/simulation-engine';
import { SimulationStoreService } from '../../shared/simulation-store.service';
import { SimulationHistoryService } from '../../shared/simulation-history.service';
import { ToastService } from '../../shared/toast.service';
import { ResourceManagementPanelComponent } from '../../shared/resource-management-panel.component';

const GREEN  = '#43A047';
const ORANGE = '#FB8C00';

export interface NewServiceDraftEquipment {
  name: string; type: string; quantity: number;
  status: 'operational' | 'maintenance' | 'broken';
}
export interface NewServiceDraft {
  name: string; head: string; doctors: number;
  nurses: number; beds: number; equipment: NewServiceDraftEquipment[];
}

interface LiveKpi {
  label: string; icon: string; unit: string;
  current: number; target: number; color: string;
}

export interface ScenarioChanges {
  addedServices:     any[];
  deletedServiceIds: number[];
  modifiedServices:  { id: number; doctors: number; nurses: number; beds: number }[];
  services:          any[];
}

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ResourceManagementPanelComponent],
  template: `
    <div class="flex flex-col h-full bg-background">
      <!-- HEADER -->
      <div class="px-6 lg:px-8 py-5 bg-card border-b">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
              <lucide-icon name="brain" class="w-6 h-6 text-white"></lucide-icon>
            </div>
            <div>
              <h1 class="text-xl font-bold text-foreground font-display">Centre de simulation et gestion des ressources</h1>
              <p class="text-sm text-muted-foreground">Testez vos décisions — rien n'est appliqué au système tant que vous ne cliquez pas sur "Appliquer".</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span *ngIf="hasChanges()" class="text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 animate-pulse"
                  style="background:#FB8C0018;color:#FB8C00">
              <lucide-icon name="alert-circle" class="w-3.5 h-3.5"></lucide-icon>
              {{ changeCount() }} modification(s) en attente
            </span>
            <span class="text-[11px] px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 bg-muted text-muted-foreground">
              <lucide-icon name="activity" class="w-3.5 h-3.5"></lucide-icon>
              Mode Simulation
            </span>
          </div>
        </div>
      </div>

      <!-- BANDEAU INFO -->
      <div class="px-6 py-2.5 border-b flex items-center gap-3 flex-wrap"
           style="background:#00BCD408;border-color:#00BCD430">
        <lucide-icon name="check-circle" class="w-3.5 h-3.5 flex-shrink-0" style="color:#0288D1"></lucide-icon>
        <span class="text-xs font-medium flex-1" style="color:#0288D1">
          Toutes vos modifications sont temporaires. Elles seront appliquées uniquement via <b>"Appliquer au système"</b>.
        </span>
        <div class="flex items-center gap-2 ml-auto">
          <button (click)="goHistory()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border"
                  style="color:#00BCD4;border-color:#00BCD430">
            <lucide-icon name="clock" class="w-3 h-3"></lucide-icon>Historique
          </button>
          <button (click)="saveScenario()" [disabled]="savingScenario()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50"
                  style="background:linear-gradient(135deg,#43A047,#2E7D32)">
            <lucide-icon [name]="savingScenario()?'loader-2':'bookmark'" class="w-3 h-3" [class.animate-spin]="savingScenario()"></lucide-icon>
            Enregistrer le scénario
          </button>
          <button *ngIf="hasChanges() || hasScenarioState()"
                  (click)="resetToRealState()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-red-50"
                  style="color:#E53935;border-color:#E5393530">
            <lucide-icon name="arrow-left" class="w-3 h-3"></lucide-icon>Retour à l'état réel
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-6xl mx-auto space-y-5">

          <!-- BANNER : dernier scénario disponible -->
          <div *ngIf="hasScenarioState() && !hasChanges()"
               class="rounded-2xl border p-4 flex items-center gap-4"
               style="background:#00BCD408;border-color:#00BCD430">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 [style.background]="'linear-gradient(135deg,'+PRIMARY+'20,'+PRIMARY_DARK+'20)'">
              <lucide-icon name="clock" class="w-5 h-5" [style.color]="PRIMARY"></lucide-icon>
            </div>
            <div class="flex-1">
              <div class="text-sm font-bold text-foreground">Un scénario précédent est disponible</div>
              <div class="text-xs text-muted-foreground mt-0.5">Vous pouvez reprendre votre dernier scénario ou repartir de l'état actuel du système.</div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button (click)="restoreScenario()"
                      class="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                      [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'">
                <lucide-icon name="clock" class="w-3.5 h-3.5 inline mr-1"></lucide-icon>Reprendre
              </button>
              <button (click)="clearScenarioState()"
                      class="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted">
                Ignorer
              </button>
            </div>
          </div>

          <!-- Hospital selector -->
          <div class="bg-card rounded-2xl border border-border shadow-sm p-5" *ngIf="isDirecteur()">
            <div class="flex items-center gap-2 mb-3">
              <lucide-icon name="activity" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
              <h2 class="font-bold text-foreground text-sm">Structure simulée</h2>
            </div>
            <select [ngModel]="hospitalId()" (ngModelChange)="onHospitalChange($event)"
                    class="w-full text-sm px-3 py-2 rounded-md border border-border bg-background">
              <option [ngValue]="null">— Sélectionner une structure —</option>
              <option *ngFor="let h of hospitals()" [ngValue]="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div class="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3" *ngIf="!isDirecteur()">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:#00BCD420">
              <lucide-icon name="activity" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
            </div>
            <div>
              <div class="text-sm font-bold text-foreground">{{ hospitals()[0]?.name }}</div>
              <div class="text-xs text-muted-foreground">Simulation pour votre service uniquement</div>
            </div>
          </div>

          <!-- SECTION Services -->
          <div class="flex items-center gap-2 mt-2 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">Services du scénario</h2>
          </div>

          <div *ngIf="hospitalId() === null"
               class="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sélectionnez une structure pour afficher ses services.
          </div>
          <div *ngIf="hospitalId() !== null && loading()" class="text-center text-sm text-muted-foreground py-6">
            Chargement des services...
          </div>
          <div *ngIf="hospitalId() !== null && !loading() && services().length === 0"
               class="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucun service. Cliquez sur « Ajouter un service » ci-dessous pour en créer un.
          </div>

          <!-- Service cards -->
          <div *ngFor="let svc of services(); trackBy: trackSvc"
               class="rounded-2xl border shadow-sm overflow-hidden"
               [class.bg-card]="!isNewService(svc)"
               [class.border-border]="!isNewService(svc)"
               [style.borderColor]="isNewService(svc) ? '#43A047' : ''"
               [style.backgroundColor]="isNewService(svc) ? '#43A04708' : ''">

            <div *ngIf="isNewService(svc)"
                 class="px-4 py-1.5 text-[11px] font-bold flex items-center gap-1.5"
                 style="background:#43A04715;color:#43A047">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
              Nouveau service — sera créé lors de "Appliquer au système"
            </div>

            <!-- Header service -->
            <div class="px-5 py-4 border-b border-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="statusColor(svc.status)"></div>
                <div>
                  <div class="font-bold text-foreground">{{ svc.name }}</div>
                  <div class="text-xs text-muted-foreground">Chef : Dr. {{ svc.head }}</div>
                </div>
              </div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                    [style.backgroundColor]="statusColor(svc.status) + '15'"
                    [style.color]="statusColor(svc.status)">{{ statusLabel(svc.status) }}</span>
            </div>

            <!-- A. Ressources humaines -->
            <div class="px-5 py-4 border-b border-border">
              <div class="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" [style.color]="PRIMARY_DARK">
                <lucide-icon name="users" class="w-3.5 h-3.5"></lucide-icon>A. Ressources humaines
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Médecins -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-muted-foreground">Nombre de médecins</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" (click)="bump(svc,'doctors',-1,50)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">−</button>
                      <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK">{{ svc.doctors }}</span>
                      <button type="button" (click)="bump(svc,'doctors',+1,50)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">+</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="50" step="1" [(ngModel)]="svc.doctors" (ngModelChange)="onSliderChange(svc)" class="hs-range w-full" [style.--c]="PRIMARY"/>
                </div>
                <!-- Infirmiers -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-muted-foreground">Nombre d'infirmiers</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" (click)="bump(svc,'nurses',-1,100)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">−</button>
                      <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK">{{ svc.nurses }}</span>
                      <button type="button" (click)="bump(svc,'nurses',+1,100)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">+</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="100" step="1" [(ngModel)]="svc.nurses" (ngModelChange)="onSliderChange(svc)" class="hs-range w-full" [style.--c]="PRIMARY"/>
                </div>
              </div>
            </div>

            <!-- B. Ressources matérielles -->
            <div class="px-5 py-4 border-b border-border">
              <div class="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" [style.color]="PRIMARY_DARK">
                <lucide-icon name="settings" class="w-3.5 h-3.5"></lucide-icon>B. Ressources matérielles
              </div>

              <!-- Lits -->
              <div class="mb-4 pb-3 border-b border-border/40">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs text-muted-foreground">Nombre de lits</span>
                  <div class="flex items-center gap-1.5">
                    <button type="button" (click)="bump(svc,'beds',-1,200)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">−</button>
                    <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK">{{ svc.beds }}</span>
                    <button type="button" (click)="bump(svc,'beds',+1,200)" class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">+</button>
                  </div>
                </div>
                <input type="range" min="0" max="200" step="1" [(ngModel)]="svc.beds"
                       (ngModelChange)="onSliderChange(svc)" class="hs-range w-full" [style.--c]="PRIMARY"/>
              </div>

              <!-- Équipements -->
              <div class="text-xs font-medium text-muted-foreground mb-2">Équipements médicaux</div>
              <div *ngIf="!(svc.equipmentList?.length)" class="text-xs text-muted-foreground italic py-1">
                Aucun équipement enregistré.
              </div>
              <div *ngIf="svc.equipmentList?.length">
                <div *ngFor="let eq of svc.equipmentList"
                     class="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
                     [style.opacity]="eq.isTransferred ? '0.85' : '1'">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <!-- ✅ CORRIGÉ : accepte statut 'operationnel' (FR) et 'operational' (EN) -->
                    <div class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                         [style.backgroundColor]="isEqOperational(eq) ? '#43A047' : '#E53935'"></div>
                    <!-- ✅ CORRIGÉ : nom || name couvre les deux champs BDD -->
                    <span class="text-xs text-foreground truncate">{{ eq.nom || eq.name }}</span>
                    <!-- Badge virtuel si équipement transféré -->
                    <span *ngIf="eq.isTransferred"
                          class="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style="background:#00BCD415;color:#0288D1">virtuel</span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button type="button"
                            (click)="eq.quantite = (eq.quantite ?? eq.quantity ?? 1) > 1 ? (eq.quantite ?? eq.quantity ?? 1) - 1 : 1; onEquipChange(svc)"
                            class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">−</button>
                    <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK">{{ eq.quantite ?? eq.quantity }}</span>
                    <button type="button"
                            (click)="eq.quantite = (eq.quantite ?? eq.quantity ?? 0) + 1; onEquipChange(svc)"
                            class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none">+</button>
                    <button type="button"
                            (click)="toggleEqStatut(eq, svc)"
                            class="ml-1 text-[10px] px-2 py-0.5 rounded border transition-colors"
                            [style.borderColor]="isEqOperational(eq) ? '#43A04750' : '#E5393550'"
                            [style.color]="isEqOperational(eq) ? '#43A047' : '#E53935'"
                            [style.backgroundColor]="isEqOperational(eq) ? '#43A04710' : '#E5393510'">
                      {{ isEqOperational(eq) ? 'Opér.' : 'Maint.' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <button type="button" (click)="openAddEq(svc)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white"
                        [style.backgroundColor]="PRIMARY">
                  <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Ajouter une ressource
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3 bg-muted/20 flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <lucide-icon name="alert-circle" class="w-3 h-3"></lucide-icon>
                Retrait local — appliqué au système via "Appliquer"
              </span>
              <button *ngIf="isDirecteur()" (click)="deleteServiceLocal(svc)"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white"
                      [style.backgroundColor]="RED">
                <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>Retirer du scénario
              </button>
            </div>
          </div>

          <div *ngIf="hospitalId() !== null && isDirecteur()" class="flex justify-center pt-2">
            <button (click)="openAddService()"
                    class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                    [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
              <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Ajouter un service au scénario
            </button>
          </div>

          <div class="flex items-center gap-2 mt-6 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">Gestion des transferts</h2>
          </div>

          <app-resource-management-panel
            [hospitals]="hospitals()"
            [defaultHospitalId]="hospitalId()"
            [isDirecteur]="isDirecteur()"
            [userServiceId]="userServiceId()"
            (transferPlanified)="onTransferPlanified($event)">
          </app-resource-management-panel>

          <div class="flex items-center gap-2 mt-6 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">Lancer la simulation</h2>
          </div>

          <button (click)="runSim()" [disabled]="running()"
                  class="w-full py-4 rounded-2xl text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                  [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
            <lucide-icon [name]="running() ? 'loader-2' : 'zap'" class="w-6 h-6" [class.animate-spin]="running()"></lucide-icon>
            {{ running() ? 'Simulation en cours…' : 'Lancer la simulation DES' }}
          </button>

        </div>
      </div>
    </div>

    <!-- MODAL ANIMATION -->
    <div *ngIf="running()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" [style.background]="'linear-gradient(135deg,'+PRIMARY+','+PRIMARY_DARK+')'">
            <lucide-icon name="activity" class="w-6 h-6 text-white animate-pulse"></lucide-icon>
          </div>
          <div>
            <h3 class="font-bold text-foreground text-base">Simulation DES en cours…</h3>
            <p class="text-xs text-muted-foreground">Calcul des indicateurs en temps réel</p>
          </div>
        </div>
        <div class="h-2 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full transition-all duration-300" [style.width.%]="animProgress()" [style.background]="'linear-gradient(90deg,'+PRIMARY+','+PRIMARY_DARK+')'"></div>
        </div>
        <p class="text-xs text-center text-muted-foreground">{{ animStep() }}</p>
        <div class="grid grid-cols-1 gap-3">
          <div *ngFor="let kpi of liveKpis()" class="flex items-center gap-4 bg-muted/30 rounded-xl px-4 py-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" [style.backgroundColor]="kpi.color+'18'">
              <lucide-icon [name]="kpi.icon" class="w-4 h-4" [style.color]="kpi.color"></lucide-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs text-muted-foreground mb-1">{{ kpi.label }}</div>
              <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" [style.backgroundColor]="kpi.color" [style.width.%]="kpiBarPct(kpi)"></div>
              </div>
            </div>
            <div class="text-right flex-shrink-0 w-16">
              <span class="text-lg font-bold" [style.color]="kpi.color">{{ kpi.current | number:'1.0-1' }}</span>
              <span class="text-[10px] text-muted-foreground ml-0.5">{{ kpi.unit }}</span>
            </div>
            <lucide-icon [name]="kpi.current > kpi.target ? 'trending-down' : 'trending-up'" class="w-4 h-4 flex-shrink-0" [style.color]="kpi.color"></lucide-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL Ajouter un service -->
    <div *ngIf="addServiceOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeAddService()">
      <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="px-5 py-4 text-white" [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2"><lucide-icon name="plus" class="w-5 h-5"></lucide-icon><h3 class="font-bold">Ajouter un service au scénario</h3></div>
            <button (click)="closeAddService()" class="p-1 hover:bg-white/20 rounded"><lucide-icon name="x" class="w-4 h-4"></lucide-icon></button>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom du service *</span><input [(ngModel)]="svcDraft.name" type="text" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background" placeholder="Ex. Cardiologie"/></label>
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chef de service *</span><input [(ngModel)]="svcDraft.head" type="text" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background" placeholder="Ex. Mansouri"/></label>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Médecins</span><input [(ngModel)]="svcDraft.doctors" type="number" min="0" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"/></label>
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infirmiers</span><input [(ngModel)]="svcDraft.nurses" type="number" min="0" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"/></label>
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lits</span><input [(ngModel)]="svcDraft.beds" type="number" min="0" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"/></label>
          </div>
        </div>
        <div class="px-5 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button (click)="closeAddService()" class="px-4 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted">Annuler</button>
          <button (click)="confirmAddService()" class="px-4 py-2 text-sm rounded-md text-white font-semibold flex items-center gap-1.5" [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Ajouter au scénario
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL Ajouter équipement -->
    <div *ngIf="addEqOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeAddEq()">
      <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
        <div class="px-5 py-4 text-white" [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2"><lucide-icon name="settings" class="w-5 h-5"></lucide-icon><h3 class="font-bold">Ajouter une ressource matérielle</h3></div>
            <button (click)="closeAddEq()" class="p-1 hover:bg-white/20 rounded"><lucide-icon name="x" class="w-4 h-4"></lucide-icon></button>
          </div>
          <p class="text-xs text-white/80 mt-1">Service : {{ addEqTargetSvc()?.name }}</p>
        </div>
        <div class="p-5 space-y-4">
          <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom *</span><input [(ngModel)]="eqDraft.name" type="text" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background" placeholder="Ex. Défibrillateur"/></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité</span><input [(ngModel)]="eqDraft.quantity" type="number" min="1" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"/></label>
            <label class="block"><span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patients/jour</span><input [(ngModel)]="eqDraft.patients_jour" type="number" min="1" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"/></label>
          </div>
          <div class="rounded-xl p-3 border text-xs" style="background:#00BCD408;border-color:#00BCD430;color:#0288D1">
            <div class="font-semibold mb-2 flex items-center gap-1.5"><lucide-icon name="clock" class="w-3.5 h-3.5"></lucide-icon>Durée moyenne d'utilisation (min)</div>
            <div class="grid grid-cols-2 gap-3">
              <label class="block"><span class="text-[11px] uppercase tracking-wider font-semibold">Min (minutes)</span><input [(ngModel)]="eqDraft.duree_min" type="number" min="1" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Ex. 20"/></label>
              <label class="block"><span class="text-[11px] uppercase tracking-wider font-semibold">Max (minutes)</span><input [(ngModel)]="eqDraft.duree_max" type="number" min="1" class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Ex. 40"/></label>
            </div>
            <p class="mt-2 text-[10px] opacity-80">Ces valeurs entrent dans le calcul du temps d'attente A4 via la simulation DES.</p>
          </div>
        </div>
        <div class="px-5 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button (click)="closeAddEq()" class="px-4 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted">Annuler</button>
          <button (click)="confirmAddEq()" class="px-4 py-2 text-sm rounded-md text-white font-semibold flex items-center gap-1.5" [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Ajouter
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SimulationComponent implements OnInit, OnDestroy {
  private api     = inject(ApiService);
  private auth    = inject(AuthService);
  private store   = inject(SimulationStoreService);
  private history = inject(SimulationHistoryService);
  private toasts  = inject(ToastService);
  private router  = inject(Router);
  private http    = inject(HttpClient);

  PRIMARY = PRIMARY; PRIMARY_DARK = PRIMARY_DARK; RED = RED;
  BASE_TOTAL_STAFF = BASE_TOTAL_STAFF;

  hospitals  = signal<Hospital[]>([]);
  hospitalId = signal<number | null>(null);
  services   = signal<Service[]>([]);
  loading        = signal(false);
  running        = signal(false);
  savingScenario = signal(false);

  private originalServices: Service[] = [];
  private newServiceIds    = new Set<number>();
  private deletedServiceIds = new Set<number>();

  hasChanges  = signal(false);
  changeCount = signal(0);
  hasScenarioState = signal(false);

  private updateChangeBadge() {
    const deleted  = this.deletedServiceIds.size;
    const added    = this.newServiceIds.size;
    const modified = this.services().filter(s => {
      if (this.newServiceIds.has(s.id)) return false;
      const orig = this.originalServices.find(o => o.id === s.id);
      return orig && (orig.doctors !== s.doctors || orig.nurses !== s.nurses || orig.beds !== s.beds);
    }).length;
    const total = deleted + added + modified;
    this.hasChanges.set(total > 0);
    this.changeCount.set(total);
    const id = this.hospitalId();
    if (id != null && total > 0) {
      this.store.saveScenarioState({
        hospitalId: id, services: this.services(),
        newServiceIds: Array.from(this.newServiceIds),
        deletedServiceIds: Array.from(this.deletedServiceIds),
      });
      this.hasScenarioState.set(true);
    }
  }

  isNewService(svc: Service): boolean { return this.newServiceIds.has(svc.id); }

  onSliderChange(svc: Service) {
    this.services.set([...this.services()]);
    this.updateChangeBadge();
  }

  onEquipChange(svc: Service) {
    this.services.set([...this.services()]);
    this.updateChangeBadge();
  }

  // ✅ CORRIGÉ : accepte 'operationnel' (FR) ET 'operational' (EN)
  isEqOperational(eq: any): boolean {
    const s = (eq.statut ?? eq.status ?? '').toLowerCase().trim();
    return s === 'operationnel' || s === 'operational';
  }

  toggleEqStatut(eq: any, svc: Service) {
    if (this.isEqOperational(eq)) {
      eq.statut = 'maintenance'; eq.status = 'maintenance';
    } else {
      eq.statut = 'operationnel'; eq.status = 'operational';
    }
    this.onEquipChange(svc);
  }

  // ✅ CORRECTION PRINCIPALE : onTransferPlanified gère maintenant les équipements
  onTransferPlanified(transfer: any) {
    const targetId  = transfer.data?.toServiceId;
    const fromId    = transfer.data?.fromServiceId;
    const count     = transfer.data?.count ?? 0;
    const qty       = transfer.data?.quantity ?? 0;
    const equipId   = transfer.data?.equipmentId;
    const equipName = (transfer.data?.equipmentName ?? '').trim();

    const updated = this.services().map(svc => {
      let s = { ...svc };

      if (transfer.type === 'equipment') {
        // ── Service SOURCE : diminuer la quantité ──────────────────────────
        if (svc.id === fromId && s.equipmentList) {
          s.equipmentList = s.equipmentList
            .map((eq: any) => {
              if (eq.id === equipId) {
                const currentQty = eq.quantite ?? eq.quantity ?? 0;
                return { ...eq, quantite: Math.max(0, currentQty - qty), quantity: Math.max(0, currentQty - qty) };
              }
              return eq;
            })
            .filter((eq: any) => (eq.quantite ?? eq.quantity ?? 0) > 0); // Supprimer si quantité = 0
        }

        // ── Service CIBLE : augmenter ou créer l'équipement ────────────────
        if (svc.id === targetId) {
          if (!s.equipmentList) s.equipmentList = [];

          const existingIdx = s.equipmentList.findIndex((eq: any) =>
            (eq.nom ?? eq.name ?? '').toLowerCase().trim() === equipName.toLowerCase()
          );

          if (existingIdx >= 0) {
            // Équipement déjà présent → augmenter la quantité
            s.equipmentList = s.equipmentList.map((eq: any, idx: number) => {
              if (idx === existingIdx) {
                const newQty = (eq.quantite ?? eq.quantity ?? 0) + qty;
                return { ...eq, quantite: newQty, quantity: newQty };
              }
              return eq;
            });
          } else {
            // Équipement absent → créer avec marqueur virtuel
            s.equipmentList = [...s.equipmentList, {
              id:                     Date.now(),
              service_id:             targetId,
              nom:                    equipName,
              name:                   equipName,
              quantite:               qty,
              quantity:               qty,
              statut:                 'operationnel',
              status:                 'operational',
              patients_par_jour:      0,
              duree_utilisation_min:  0,
              duree_utilisation_max:  0,
              isTransferred:          true, // Badge "virtuel" dans le template
            }];
          }
        }

      } else {
        // ── Personnel (médecins / infirmiers) — logique inchangée ──────────
        if (svc.id === targetId) {
          if (transfer.type === 'infirmier') s.nurses  = (Number(svc.nurses)  || 0) + count;
          if (transfer.type === 'medecin')   s.doctors = (Number(svc.doctors) || 0) + count;
        }
        if (svc.id === fromId) {
          if (transfer.type === 'infirmier') s.nurses  = Math.max(0, (Number(svc.nurses)  || 0) - count);
          if (transfer.type === 'medecin')   s.doctors = Math.max(0, (Number(svc.doctors) || 0) - count);
        }
      }
      return s;
    });

    this.services.set(updated);
    this.updateChangeBadge();
    this.toasts.show({
      title: 'Ressources mises à jour (virtuel)',
      description: `${transfer.label} — lancez la simulation pour voir l'impact sur les KPIs.`,
      variant: 'success'
    });
  }

  restoreScenario() {
    const state = this.store.getScenarioState();
    if (!state) return;
    this.hospitalId.set(state.hospitalId);
    this.services.set(state.services);
    this.newServiceIds     = new Set(state.newServiceIds);
    this.deletedServiceIds = new Set(state.deletedServiceIds);
    this.updateChangeBadge();
    this.toasts.show({ title: 'Scénario restauré', description: 'Votre dernier scénario a été rechargé.', variant: 'success' });
  }

  clearScenarioState() {
    this.store.clearScenarioState();
    this.hasScenarioState.set(false);
    this.toasts.show({ title: 'Scénario ignoré', description: 'L\'état précédent a été effacé.', variant: 'default' });
  }

  resetToRealState() {
    if (!confirm('Réinitialiser le scénario ? Toutes vos modifications locales seront perdues.')) return;
    const id = this.hospitalId();
    this.newServiceIds.clear(); this.deletedServiceIds.clear();
    this.store.clearScenarioState();
    this.hasScenarioState.set(false); this.hasChanges.set(false); this.changeCount.set(0);
    if (id != null) this.loadServices(id);
    this.toasts.show({ title: 'Scénario réinitialisé', description: 'Retour à l\'état réel du système.', variant: 'default' });
  }

  buildChanges(): ScenarioChanges {
    const added = this.services().filter(s => this.newServiceIds.has(s.id))
      .map(s => ({ name: s.name, head: s.head, doctors: s.doctors, nurses: s.nurses, beds: s.beds, equipment: s.equipment || [] }));
    const modified = this.services().filter(s => {
      if (this.newServiceIds.has(s.id)) return false;
      const orig = this.originalServices.find(o => o.id === s.id);
      return orig && (orig.doctors !== s.doctors || orig.nurses !== s.nurses || orig.beds !== s.beds);
    }).map(s => ({ id: s.id, doctors: s.doctors, nurses: s.nurses, beds: s.beds }));
    return { addedServices: added, deletedServiceIds: Array.from(this.deletedServiceIds), modifiedServices: modified, services: this.services() };
  }

  animProgress = signal(0);
  animStep     = signal('Initialisation du moteur DES…');
  liveKpis     = signal<LiveKpi[]>([]);
  private animInterval: any = null;
  private animFrame = 0;

  private readonly ANIM_STEPS = [
    'Initialisation du moteur DES…', 'Calcul du taux d\'arrivée λ…',
    'Calcul du taux de service µ…', 'Application de la formule d\'Erlang-C…',
    'Calcul du temps d\'attente Wq…', 'Simulation du flux de patients…',
    'Calcul de l\'occupation des lits…', 'Évaluation de la couverture…',
    'Génération des projections…', 'Analyse des recommandations…', 'Finalisation…',
  ];

  private groupsByService = computed<Map<number, Array<any>>>(() => {
    const m = new Map<number, Array<any>>();
    for (const svc of this.services()) {
      const groups = new Map<string, any>();
      for (const eq of svc.equipment || []) {
        let g = groups.get(eq.name);
        if (!g) { g = { name: eq.name, type: eq.type, operational: 0, maintenance: 0, broken: 0, slug: this.slugify(eq.name) }; groups.set(eq.name, g); }
        const q = Number(eq.quantity) || 0;
        if (eq.status === 'operational') g.operational += q;
        else if (eq.status === 'maintenance') g.maintenance += q;
        else g.broken += q;
      }
      m.set(svc.id, Array.from(groups.values()));
    }
    return m;
  });

  addServiceOpen = signal(false);
  svcDraft: NewServiceDraft = this.emptySvcDraft();
  addEqOpen      = signal(false);
  addEqTargetSvc = signal<Service | null>(null);
  eqDraft: { name: string; quantity: number; duree_min: number; duree_max: number; patients_jour: number } = { name: '', quantity: 1, duree_min: 20, duree_max: 40, patients_jour: 5 };

  ngOnInit() {
    const saved = this.store.getScenarioState();
    this.hasScenarioState.set(!!saved);
    this.api.listHospitals().subscribe({
      next: (h) => {
        this.hospitals.set(h);
        if (saved != null && (saved.services ?? []).length > 0) {
          this.hospitalId.set(saved.hospitalId);
          this.originalServices = JSON.parse(JSON.stringify(saved.services));
          this.services.set(saved.services);
          this.newServiceIds     = new Set(saved.newServiceIds || []);
          this.deletedServiceIds = new Set(saved.deletedServiceIds || []);
          this.updateChangeBadge();
          return;
        }
        const user = this.auth.currentUser();
        if (user?.role === 'chef_service' && user.hospital_id) {
          const hospital = h.find(hosp => hosp.id === user.hospital_id) ?? h[0];
          if (hospital) { this.hospitalId.set(hospital.id); this.loadServices(hospital.id); }
        } else if (h.length > 0) { this.hospitalId.set(h[0].id); this.loadServices(h[0].id); }
      },
      error: () => {},
    });
  }

  ngOnDestroy() { this.stopAnim(); }

  onHospitalChange(id: number | null) {
    this.hospitalId.set(id);
    this.newServiceIds.clear(); this.deletedServiceIds.clear();
    this.hasChanges.set(false); this.changeCount.set(0);
    if (id == null) { this.services.set([]); return; }
    this.loadServices(id);
  }

  loadServices(id: number) {
    this.loading.set(true);
    this.api.listServices(id).subscribe({
      next: (s) => {
        const user = this.auth.currentUser();
        let filtered = s;
        if (user?.role === 'chef_service' && user.service_id) {
          filtered = s.filter(svc => svc.id === user.service_id);
        }
        this.originalServices = JSON.parse(JSON.stringify(filtered));
        this.services.set(filtered);
        this.loading.set(false);
        this.updateChangeBadge();
        filtered.forEach(svc => {
          this.api.getServiceEquipments(svc.id).subscribe({
            next: (eqs) => { svc.equipmentList = eqs; this.services.set([...this.services()]); },
            error: () => {},
          });
        });
      },
      error: () => { this.services.set([]); this.loading.set(false); },
    });
  }

  totalDoctors(): number { return this.services().reduce((a, s) => a + (Number(s.doctors) || 0), 0); }
  totalNurses():  number { return this.services().reduce((a, s) => a + (Number(s.nurses)  || 0), 0); }

  bump(svc: Service, key: 'doctors' | 'nurses' | 'beds', delta: number, max: number) {
    const next = Math.min(max, Math.max(0, (Number(svc[key]) || 0) + delta));
    (svc as any)[key] = next;
    this.services.set([...this.services()]);
    this.updateChangeBadge();
  }

  equipmentGroups(svc: Service) { return this.groupsByService().get(svc.id) || []; }
  private slugify(s: string): string { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  trackSvc = (_: number, s: Service) => s.id;

  emptySvcDraft(): NewServiceDraft { return { name: '', head: '', doctors: 0, nurses: 0, beds: 0, equipment: [] }; }
  openAddService()  { this.svcDraft = this.emptySvcDraft(); this.addServiceOpen.set(true); }
  closeAddService() { this.addServiceOpen.set(false); }

  confirmAddService() {
    const id = this.hospitalId();
    if (id == null) { this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez une structure.', variant: 'destructive' }); return; }
    const d = this.svcDraft;
    if (!d.name.trim() || !d.head.trim()) { this.toasts.show({ title: 'Champs requis', description: 'Nom et chef obligatoires.', variant: 'destructive' }); return; }
    const newId = Date.now();
    const newSvc: Service = { id: newId, hospitalId: id, name: d.name.trim(), head: d.head.trim(), doctors: Number(d.doctors)||0, nurses: Number(d.nurses)||0, beds: Number(d.beds)||0, availableBeds: Number(d.beds)||0, patients: 0, status: 'normal', equipment: [] };
    this.newServiceIds.add(newId);
    this.services.set([...this.services(), newSvc]);
    this.toasts.show({ title: 'Service ajouté au scénario', description: `${newSvc.name} — sera créé lors de l'application.`, variant: 'success' });
    this.addServiceOpen.set(false);
    this.updateChangeBadge();
  }

  openAddEq(svc: Service) { this.addEqTargetSvc.set(svc); this.eqDraft = { name: '', quantity: 1, duree_min: 20, duree_max: 40, patients_jour: 5 }; this.addEqOpen.set(true); }
  closeAddEq() { this.addEqOpen.set(false); this.addEqTargetSvc.set(null); }

  confirmAddEq() {
    const svc = this.addEqTargetSvc(); if (!svc) return;
    if (!this.eqDraft.name.trim()) { this.toasts.show({ title: 'Champ requis', description: 'Nom obligatoire.', variant: 'destructive' }); return; }
    const maxId = (svc.equipment||[]).reduce((m: number, e: any) => Math.max(m, e.id), 0);
    const newEq: Equipment = { id: (maxId||0)*1000+Math.floor(Math.random()*999)+1, serviceId: svc.id, name: this.eqDraft.name.trim(), type: '—', quantity: Math.max(1, Number(this.eqDraft.quantity)||1), status: 'operational' };
    svc.equipment = [...(svc.equipment||[]), newEq];
    const newEqDetail = {
      id: newEq.id,
      service_id: svc.id,
      nom: this.eqDraft.name.trim(),
      name: this.eqDraft.name.trim(),
      quantite: Math.max(1, Number(this.eqDraft.quantity)||1),
      quantity: Math.max(1, Number(this.eqDraft.quantity)||1),
      patients_par_jour: Math.max(1, Number(this.eqDraft.patients_jour)||5),
      duree_utilisation_min: Math.max(1, Number(this.eqDraft.duree_min)||20),
      duree_utilisation_max: Math.max(1, Number(this.eqDraft.duree_max)||40),
      statut: 'operationnel',
      status: 'operational',
      isNew: true,
    };
    svc.equipmentList = [...(svc.equipmentList || []), newEqDetail];
    this.services.set(this.services().map(s => s.id === svc.id ? { ...svc } : s));
    this.toasts.show({ title: 'Ressource ajoutée', description: `${newEq.name} — visible dans le scénario. Sera enregistré lors de "Appliquer".`, variant: 'success' });
    this.addEqOpen.set(false); this.addEqTargetSvc.set(null);
    this.updateChangeBadge();
  }

  deleteServiceLocal(svc: Service) {
    if (!confirm(`Retirer « ${svc.name} » du scénario ?`)) return;
    if (this.newServiceIds.has(svc.id)) this.newServiceIds.delete(svc.id);
    else this.deletedServiceIds.add(svc.id);
    this.services.set(this.services().filter(s => s.id !== svc.id));
    this.toasts.show({ title: 'Service retiré du scénario', description: `${svc.name} sera supprimé lors de l'application.`, variant: 'default' });
    this.updateChangeBadge();
  }

  kpiBarPct(kpi: LiveKpi): number { return Math.min(100, Math.max(0, (kpi.current / (kpi.unit === 'min' ? 60 : 100)) * 100)); }

  private startAnim(before: any) {
    this.animFrame = 0; this.animProgress.set(0); this.animStep.set(this.ANIM_STEPS[0]);
    const initKpis: LiveKpi[] = [
      { label: "Temps d'attente", icon: 'clock',       unit: 'min', current: before.waiting_time_minutes||0, target: 0, color: '#FB8C00' },
      { label: 'Occupation lits', icon: 'bed',         unit: '%',   current: before.bed_occupancy_rate||0,   target: 0, color: '#E53935' },
      { label: 'Ressources',      icon: 'activity',    unit: '%',   current: before.resource_utilization||0, target: 0, color: '#00BCD4' },
      { label: 'Couverture',      icon: 'layout-grid', unit: '%',   current: before.service_coverage||0,     target: 0, color: '#43A047' },
    ];
    this.liveKpis.set(initKpis);
    this.animInterval = setInterval(() => {
      this.animFrame++;
      this.animProgress.set(Math.min(95, this.animFrame * 3));
      this.animStep.set(this.ANIM_STEPS[Math.min(Math.floor(this.animFrame / 4), this.ANIM_STEPS.length - 1)]);
      this.liveKpis.set(this.liveKpis().map(k => ({ ...k, current: Math.max(0, Math.round((k.current - (k.current - (k.target||k.current*0.8))*0.05 + (Math.random()-0.5)*0.3) * 10) / 10) })));
    }, 150);
  }

  private stopAnim() { if (this.animInterval) { clearInterval(this.animInterval); this.animInterval = null; } }

  runSim() {
    const id = this.hospitalId();
    if (id == null) { this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez une structure.', variant: 'destructive' }); return; }
    this.running.set(true);

    const totalDoctors  = this.totalDoctors();
    const totalNurses   = this.totalNurses();
    const totalBeds     = this.services().reduce((a, s) => a + (Number(s.beds) || 0), 0);
    const totalPatients = this.services().reduce((a, s) => a + (Number(s.patients) || 0), 0);
    const hospital = this.hospitals().find(h => h.id === id);
    const hAny = hospital as any;
    const svcs = this.services();
    const origDoctors = this.originalServices.reduce((a, s) => a + (Number(s.doctors) || 0), 0);
    const origNurses  = this.originalServices.reduce((a, s) => a + (Number(s.nurses)  || 0), 0);
    const origBeds    = this.originalServices.reduce((a, s) => a + (Number(s.beds)    || 0), 0);

    const servicesPayload = svcs.map(s => {
      const sAny = s as any;
      const eqList = s.equipment || [];
      const dmsH = sAny.dmsHeures || sAny.dms_heures || 96;
      return {
        id: s.id, name: s.name,
        doctors: s.doctors, nurses: s.nurses,
        beds: s.beds, patients: s.patients,
        dms_heures: dmsH,
        dms_min_h: (sAny.dms_min_jours ?? 1) * 24,
        dms_max_h: (sAny.dms_max_jours ?? 60) * 24,
        consultation_min_h: (sAny.consultation_min_min ?? 10) / 60,
        consultation_max_h: (sAny.consultation_max_min ?? 30) / 60,
        soin_inf_min_h: (sAny.soin_inf_min_min ?? sAny.soinInfMinMin ?? 25) / 60,
        soin_inf_max_h: (sAny.soin_inf_max_min ?? sAny.soinInfMaxMin ?? 35) / 60,
        equip_min_h: (sAny.equip_min_min ?? 25) / 60,
        equip_max_h: (sAny.equip_max_min ?? 35) / 60,
        simulation_hours: sAny.simulation_hours ?? 24,
        mortalite_base: sAny.mortalite_base || 1.5,
        score_distribution_eq: sAny.score_distribution_eq || 75,
        score_gestion_dechets: sAny.score_gestion_dechets || 75,
        salaire_medecin: sAny.salaire_medecin || 120000,
        salaire_infirmier: sAny.salaire_infirmier || 75000,
        cout_medicament_unit: sAny.cout_medicament_unit || 2500,
        cout_maintenance_eq: sAny.cout_maintenance_eq || 50000,
        equipment_operational: eqList.filter((e: any) => e.status === 'operational').reduce((b: number, e: any) => b + (Number(e.quantity) || 0), 0),
        equipment_count: eqList.reduce((b: number, e: any) => b + (Number(e.quantity) || 0), 0),
        equipment: eqList.map((e: any) => ({ name: e.name, type: e.type || '—', quantity: Number(e.quantity) || 0, status: e.status || 'operational' })),
        equipment_list: (s.equipmentList ?? []).map((eq: any) => ({
          nom: eq.nom ?? eq.name,
          quantite: eq.quantite ?? eq.quantity,
          patients_par_jour: eq.patients_par_jour,
          duree_utilisation_min: eq.duree_utilisation_min,
          duree_utilisation_max: eq.duree_utilisation_max,
          statut: eq.statut ?? eq.status,
        })),
        lambda_patients_jour: s.lambda_patients_jour ?? 50,
      };
    });

    const totalEqOperational = svcs.reduce((a, s) => a + (s.equipment || []).filter((e: any) => e.status === 'operational').reduce((b: number, e: any) => b + (Number(e.quantity) || 0), 0), 0);
    const totalEqAll = svcs.reduce((a, s) => a + (s.equipment || []).reduce((b: number, e: any) => b + (Number(e.quantity) || 0), 0), 0);

    const payload = {
      hospital_id: id,
      scenario_name: `Scénario - ${new Date().toLocaleDateString('fr-FR')}`,
      target_doctors: totalDoctors, target_nurses: totalNurses, target_beds: totalBeds,
      available_equipment: totalEqOperational,
      current_doctors: hAny?.total_doctors ?? origDoctors,
      current_nurses: hAny?.total_nurses ?? origNurses,
      current_beds: hAny?.total_beds ?? origBeds,
      current_equipment: Math.round(totalEqAll * 0.8),
      active_patients: totalPatients || hAny?.active_patients || 80,
      budget_annuel: hAny?.budgetAnnuel || hAny?.budget_annuel || 500000000,
      score_localisation: hAny?.scoreLocalisation || 80,
      score_air_interieur: hAny?.scoreAirInterieur || 75,
      score_acoustique: hAny?.scoreAcoustique || 70,
      mortalite_base: 1.5,
      cout_maintenance_eq: 50000,
      dms_min_h: 24, dms_max_h: 1440,
      consultation_min_h: 10 / 60, consultation_max_h: 30 / 60,
      lambda_patients_jour: svcs.reduce((sum, s) => sum + (s.lambda_patients_jour ?? 50), 0),
      original_services: this.originalServices.map(s => ({
        id: s.id, name: s.name,
        beds:    Number(s.beds)    || 0,
        patients:Number(s.patients)|| 0,
        doctors: Number(s.doctors) || 0,
        nurses:  Number(s.nurses)  || 0,
        score_distribution_eq: (s as any).score_distribution_eq ?? 75,
        score_gestion_dechets: (s as any).score_gestion_dechets || 75,
      })),
      services: servicesPayload,
    };

    const occBefore = totalBeds > 0 ? Math.round(totalPatients / totalBeds * 100) : 75;
    this.startAnim({ waiting_time_minutes: 35, bed_occupancy_rate: occBefore, resource_utilization: 70, service_coverage: 50 });

    this.api.runSimulation(payload).subscribe({
      next: (result: any) => {
        this.liveKpis.set(this.liveKpis().map((k, i) => ({ ...k, target: [result.after?.waiting_time_minutes||0, result.after?.bed_occupancy_rate||0, result.after?.resource_utilization||0, result.after?.service_coverage||0][i] })));
        this.animProgress.set(100); this.animStep.set('Simulation terminée !');
        setTimeout(() => {
          this.stopAnim();
          const changes = this.buildChanges();
          this.store.set({ input: payload, result, changes });
          this.store.saveScenarioState({ hospitalId: id, services: this.services(), newServiceIds: Array.from(this.newServiceIds), deletedServiceIds: Array.from(this.deletedServiceIds) });
          this.hasScenarioState.set(true);
          this.history.save({ scenarioName: payload.scenario_name, input: { target_doctors: payload.target_doctors, target_nurses: payload.target_nurses, target_beds: payload.target_beds, available_equipment: payload.available_equipment, active_patients: payload.active_patients, hospital_id: payload.hospital_id }, result: { before: result.before, after: result.after, improvements: result.improvements }, projections: result.projections || [], recommendations: result.recommendations || [] });
          this.running.set(false);
          this.toasts.show({ title: 'Simulation terminée', description: 'Voir les résultats.', variant: 'success' });
          this.router.navigate(['/simulation-result']);
        }, 800);
      },
      error: () => {
        this.stopAnim(); this.running.set(false);
        this.toasts.show({ title: 'Erreur', description: 'Impossible de lancer la simulation. Vérifiez que le serveur Python tourne sur le port 5000.', variant: 'destructive' });
      },
    });
  }

  goHistory() { this.router.navigate(['/simulation-history']); }

  saveScenario() {
    const id = this.hospitalId();
    if (id == null) { this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez une structure.', variant: 'destructive' }); return; }
    this.savingScenario.set(true);
    const now = new Date();
    const scenarioName = `Scénario — ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    const inputData = { hospital_id: id, scenario_name: scenarioName, target_doctors: this.totalDoctors(), target_nurses: this.totalNurses(), target_beds: this.services().reduce((a, s) => a + (Number(s.beds)||0), 0), active_patients: this.services().reduce((a, s) => a + (Number(s.patients)||0), 0), services: this.services() };
    this.http.post<any>('http://localhost:8000/api/simulation-history', { scenario_name: scenarioName, input_data: inputData, result_data: null, changes_data: this.buildChanges() }).subscribe({
      next: () => { this.savingScenario.set(false); this.toasts.show({ title: 'Scénario enregistré !', description: scenarioName, variant: 'success' }); },
      error: () => { this.savingScenario.set(false); this.toasts.show({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' }); }
    });
  }

  isDirecteur(): boolean { return this.auth.isDirecteur(); }
  userServiceId(): number | null { return this.auth.userServiceId(); }
  statusColor(s: string): string { if (s === 'critical') return '#E53935'; if (s === 'medium' || s === 'high') return '#FB8C00'; return '#43A047'; }
  statusLabel(s: string): string { if (s === 'critical') return 'Critique'; if (s === 'medium' || s === 'high') return 'Moyenne'; return 'Normale'; }
  eqColor(s: string): string { return s === 'operational' ? '#43A047' : s === 'maintenance' ? '#FB8C00' : '#E53935'; }
  eqLabel(s: string): string { return s === 'operational' ? 'Opérationnel' : s === 'maintenance' ? 'Maintenance' : 'Hors service'; }
}