import { Component, Input, OnChanges, OnInit, Output, EventEmitter, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Hospital, Service, Equipment } from './models';
import { PRIMARY } from './simulation-engine';
import { ToastService } from './toast.service';
import { SimulationStoreService } from './simulation-store.service';

const PRIMARY_DARK = '#0288D1';
const GREEN        = '#43A047';
const ORANGE       = '#FB8C00';
const RED          = '#E53935';
import { environment } from '../../environments/environment';
const BASE         = environment.apiUrl;

const AGENTS_SPECIALISES = ['Psychologue', 'Assistant général', 'Kinésithérapeute', 'Diabétologue'];

export interface TransferAction {
  id: string;
  type: 'equipment' | 'medecin' | 'infirmier' | 'agent';
  label: string;
  detail: string;
  isNewEquipment?: boolean;
  data: any;
}

@Component({
  selector: 'app-resource-management-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" data-testid="resource-management-panel">

      <!-- HEADER -->
      <div class="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2 flex-wrap">
        <lucide-icon name="arrow-right" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
        <h2 class="font-bold text-foreground text-sm">Transferts entre services</h2>
        <span class="ml-auto text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
              style="background:#00BCD415;color:#0288D1">
          <lucide-icon name="activity" class="w-3 h-3"></lucide-icon>
          Mode simulation — virtuel
        </span>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-border bg-card overflow-x-auto">
        <button *ngFor="let tab of tabs" (click)="rootTab.set(tab.key)"
                [class.text-foreground]="rootTab() === tab.key"
                [class.text-muted-foreground]="rootTab() !== tab.key"
                [style.borderBottomColor]="rootTab() === tab.key ? PRIMARY : 'transparent'"
                class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors hover:bg-muted/30 whitespace-nowrap flex items-center gap-1.5">
          <lucide-icon [name]="tab.icon" class="w-3.5 h-3.5"></lucide-icon>
          {{ tab.label }}
        </button>
        <button (click)="rootTab.set('journal')"
                [class.text-foreground]="rootTab() === 'journal'"
                [class.text-muted-foreground]="rootTab() !== 'journal'"
                [style.borderBottomColor]="rootTab() === 'journal' ? PRIMARY : 'transparent'"
                class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors hover:bg-muted/30 flex items-center gap-1.5">
          <lucide-icon name="activity" class="w-3.5 h-3.5"></lucide-icon>
          Journal
          <span *ngIf="transfers().length > 0"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                [style.backgroundColor]="PRIMARY">{{ transfers().length }}</span>
        </button>
      </div>

      <!-- Sélecteur hôpital commun -->
      <div class="px-4 pt-4 pb-2" *ngIf="rootTab() !== 'journal'">
        <label class="block">
          <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure</span>
          <select [(ngModel)]="selectedHospitalId" (ngModelChange)="onHospitalChange($event)"
                  class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background">
            <option [ngValue]="null">— Sélectionner —</option>
            <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
          </select>
        </label>
      </div>

      <!-- TAB ÉQUIPEMENTS -->
      <div *ngIf="rootTab() === 'equipment'" class="p-4 space-y-3">

        <!-- DIRECTEUR -->
        <ng-container *ngIf="isDirecteur">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service source</span>
              <select [(ngModel)]="eq.fromServiceId" (ngModelChange)="onEqFromService($event)"
                      [disabled]="!selectedHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of services" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service cible</span>
              <!-- ✅ CORRECTION : ajout (ngModelChange)="onEqToService($event)" -->
              <select [(ngModel)]="eq.toServiceId" (ngModelChange)="onEqToService($event)"
                      [disabled]="!eq.fromServiceId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of servicesFiltered(eq.fromServiceId)" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
          </div>

          <!-- Spinner -->
          <div *ngIf="eq.loadingEquipment" class="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <lucide-icon name="loader-2" class="w-3.5 h-3.5 animate-spin"></lucide-icon>
            Chargement des équipements depuis la base de données…
          </div>

          <!-- Aucun équipement -->
          <div *ngIf="!eq.loadingEquipment && eq.fromServiceId && eq.sourceEquipment.length === 0"
               class="text-xs text-muted-foreground italic py-1 flex items-center gap-1.5">
            <lucide-icon name="alert-circle" class="w-3.5 h-3.5 text-orange-400"></lucide-icon>
            Aucun équipement trouvé dans ce service.
          </div>

          <div class="grid grid-cols-12 gap-2 items-end">
            <label class="col-span-7 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Équipement</span>
              <!-- ✅ CORRECTION : ajout (ngModelChange)="onEqSelected($event)" -->
              <select [(ngModel)]="eq.equipmentId" (ngModelChange)="onEqSelected($event)"
                      [disabled]="eq.sourceEquipment.length === 0 || eq.loadingEquipment"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let e of eq.sourceEquipment" [ngValue]="e.id">{{ e.name }} (×{{ e.quantity || e.quantite }})</option>
              </select>
            </label>
            <label class="col-span-2 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Qté</span>
              <input type="number" min="1" [(ngModel)]="eq.quantity" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
            </label>
            <button (click)="submitEqTransfer()"
                    [disabled]="!eq.fromServiceId || !eq.toServiceId || !eq.equipmentId"
                    class="col-span-3 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    [style.backgroundColor]="PRIMARY">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier
            </button>
          </div>

          <!-- ✅ NOUVEAU : alerte équipement absent dans la cible -->
          <div *ngIf="eq.isNewInTarget && eq.equipmentId && eq.toServiceId"
               class="text-[11px] px-3 py-2.5 rounded-lg flex items-start gap-2"
               style="background:#FFF3E0;border:1px solid #FB8C0050;color:#E65100">
            <lucide-icon name="alert-circle" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></lucide-icon>
            <span>Cet équipement <b>n'existe pas encore</b> dans le service cible.
            Il sera <b>créé automatiquement</b> lors de l'application avec un
            <b>taux d'utilisation virtuel de 0%</b>.
            Le chef de service devra le mettre à jour ensuite.</span>
          </div>
        </ng-container>

        <!-- CHEF DE SERVICE -->
        <ng-container *ngIf="!isDirecteur">
          <div class="grid grid-cols-12 gap-2 items-end">
            <label class="col-span-12 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Demander depuis le service</span>
              <select [(ngModel)]="eq.fromServiceId" (ngModelChange)="onEqFromService($event)"
                      [disabled]="!selectedHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner un service —</option>
                <option *ngFor="let s of servicesFiltered(userServiceId)" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>

            <!-- Spinner -->
            <div *ngIf="eq.loadingEquipment" class="col-span-12 flex items-center gap-2 text-xs text-muted-foreground py-1">
              <lucide-icon name="loader-2" class="w-3.5 h-3.5 animate-spin"></lucide-icon>
              Chargement…
            </div>

            <label class="col-span-7 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Équipement</span>
              <select [(ngModel)]="eq.equipmentId" (ngModelChange)="onEqSelectedChef($event)"
                      [disabled]="eq.sourceEquipment.length === 0 || eq.loadingEquipment"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let e of eq.sourceEquipment" [ngValue]="e.id">{{ e.name }} (×{{ e.quantity || e.quantite }})</option>
              </select>
            </label>
            <label class="col-span-2 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Qté</span>
              <input type="number" min="1" [(ngModel)]="eq.quantity" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
            </label>
            <button (click)="submitEqTransferChef()" class="col-span-3 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5" [style.backgroundColor]="PRIMARY">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier
            </button>
          </div>

          <!-- Alerte équipement nouveau dans le service du chef -->
          <div *ngIf="eq.isNewInTargetChef && eq.equipmentId"
               class="text-[11px] px-3 py-2.5 rounded-lg flex items-start gap-2"
               style="background:#FFF3E0;border:1px solid #FB8C0050;color:#E65100">
            <lucide-icon name="alert-circle" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></lucide-icon>
            <span>Cet équipement <b>n'est pas encore</b> dans votre service.
            Il sera <b>créé avec taux d'utilisation 0%</b> lors de l'application.</span>
          </div>
        </ng-container>
      </div>

      <!-- TAB MÉDECINS -->
      <div *ngIf="rootTab() === 'medecin'" class="p-4 space-y-3">
        <ng-container *ngIf="isDirecteur" [ngTemplateOutlet]="staffForm"
          [ngTemplateOutletContext]="{type:'medecin',label:'médecins'}"></ng-container>
        <ng-container *ngIf="!isDirecteur">
          <div class="grid grid-cols-3 gap-3">
            <label class="block col-span-3">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Demander depuis le service</span>
              <select [(ngModel)]="staff.fromServiceId" [disabled]="!selectedHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner un service —</option>
                <option *ngFor="let s of servicesFiltered(userServiceId)" [ngValue]="s.id">{{ s.name }} ({{ s.doctors }} méd.)</option>
              </select>
            </label>
            <label class="block col-span-2">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre à demander</span>
              <input type="number" min="1" [(ngModel)]="staff.count" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
            </label>
            <button (click)="submitStaffTransferChef('medecin')" class="self-end text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5" [style.backgroundColor]="PRIMARY">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier
            </button>
          </div>
        </ng-container>
      </div>

      <!-- TAB INFIRMIERS -->
      <div *ngIf="rootTab() === 'infirmier'" class="p-4 space-y-3">
        <ng-container *ngIf="isDirecteur" [ngTemplateOutlet]="staffForm"
          [ngTemplateOutletContext]="{type:'infirmier',label:'infirmiers'}"></ng-container>
        <ng-container *ngIf="!isDirecteur">
          <div class="grid grid-cols-3 gap-3">
            <label class="block col-span-3">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Demander depuis le service</span>
              <select [(ngModel)]="staff.fromServiceId" [disabled]="!selectedHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
                <option [ngValue]="null">— Sélectionner un service —</option>
                <option *ngFor="let s of servicesFiltered(userServiceId)" [ngValue]="s.id">{{ s.name }} ({{ s.nurses }} inf.)</option>
              </select>
            </label>
            <label class="block col-span-2">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre à demander</span>
              <input type="number" min="1" [(ngModel)]="staff.count" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
            </label>
            <button (click)="submitStaffTransferChef('infirmier')" class="self-end text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5" [style.backgroundColor]="PRIMARY">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier
            </button>
          </div>
        </ng-container>
      </div>

      <!-- TAB AGENTS SPÉCIALISÉS -->
      <div *ngIf="rootTab() === 'agent'" class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service source</span>
            <select [(ngModel)]="agent.fromServiceId" [disabled]="!selectedHospitalId"
                    class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
              <option [ngValue]="null">— Sélectionner —</option>
              <option *ngFor="let s of services" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service cible</span>
            <select [(ngModel)]="agent.toServiceId" [disabled]="!agent.fromServiceId"
                    class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
              <option [ngValue]="null">— Sélectionner —</option>
              <option *ngFor="let s of servicesFiltered(agent.fromServiceId)" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </label>
        </div>
        <div class="grid grid-cols-12 gap-2 items-end">
          <label class="col-span-5 block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Type d'agent</span>
            <select [(ngModel)]="agent.type" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background">
              <option *ngFor="let a of agentsSpecialises" [value]="a">{{ a }}</option>
            </select>
          </label>
          <label class="col-span-4 block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre</span>
            <input type="number" min="1" [(ngModel)]="agent.count" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
          </label>
          <button (click)="submitAgentTransfer()" class="col-span-3 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5" [style.backgroundColor]="PRIMARY">
            <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier
          </button>
        </div>
      </div>

      <!-- TEMPLATE STAFF -->
      <ng-template #staffForm let-type="type" let-label="label">
        <div class="grid grid-cols-3 gap-3">
          <label class="block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service source</span>
            <select [(ngModel)]="staff.fromServiceId" [disabled]="!selectedHospitalId"
                    class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
              <option [ngValue]="null">— Sélectionner —</option>
              <option *ngFor="let s of services" [ngValue]="s.id">
                {{ s.name }} ({{ type === 'medecin' ? s.doctors : s.nurses }} disp.)
              </option>
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service cible</span>
            <select [(ngModel)]="staff.toServiceId" [disabled]="!staff.fromServiceId"
                    class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50">
              <option [ngValue]="null">— Sélectionner —</option>
              <option *ngFor="let s of servicesFiltered(staff.fromServiceId)" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre</span>
            <input type="number" min="1" [(ngModel)]="staff.count" class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"/>
          </label>
        </div>
        <div class="flex justify-end">
          <button (click)="submitStaffTransfer(type)" class="text-xs px-4 py-1.5 rounded-md text-white font-semibold flex items-center gap-1.5" [style.backgroundColor]="PRIMARY">
            <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>Planifier le transfert
          </button>
        </div>
      </ng-template>

      <!-- TAB JOURNAL -->
      <div *ngIf="rootTab() === 'journal'" class="p-4">
        <div *ngIf="transfers().length === 0" class="text-center py-8 text-muted-foreground text-sm">
          <lucide-icon name="activity" class="w-8 h-8 mx-auto mb-2 opacity-30"></lucide-icon>
          Aucun transfert planifié.
        </div>

        <div *ngIf="transfers().length > 0" class="space-y-3">
          <div class="text-[11px] px-3 py-2 rounded-lg flex items-center gap-2" style="background:#00BCD410;color:#0288D1">
            <lucide-icon name="check-circle" class="w-3.5 h-3.5 flex-shrink-0"></lucide-icon>
            <span><b>Simulation virtuelle</b> — Les ressources ci-dessous sont déjà reflétées dans les sliders. Lancez la simulation pour voir l'impact sur les KPIs.</span>
          </div>

          <div class="space-y-2">
            <div *ngFor="let t of transfers()"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                 [style.borderColor]="transferColor(t.type)+'30'"
                 [style.backgroundColor]="transferColor(t.type)+'08'">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   [style.backgroundColor]="transferColor(t.type)+'18'">
                <lucide-icon [name]="transferIcon(t.type)" class="w-4 h-4" [style.color]="transferColor(t.type)"></lucide-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  {{ t.label }}
                  <!-- ✅ Badge "NOUVEAU" pour équipements absents dans la cible -->
                  <span *ngIf="t.isNewEquipment"
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style="background:#FF6F0020;color:#E65100;border:1px solid #FB8C0040">
                    ✦ NOUVEAU DANS CIBLE
                  </span>
                </div>
                <div class="text-[11px] text-muted-foreground mt-0.5">{{ t.detail }}</div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    [style.backgroundColor]="transferColor(t.type)+'15'"
                    [style.color]="transferColor(t.type)">{{ transferTypeLabel(t.type) }}</span>
              <button (click)="removeTransfer(t.id)"
                      class="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500">
                <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Note taux d'utilisation si nouvel équipement -->
          <div *ngIf="hasNewEquipment()"
               class="text-[11px] px-3 py-2.5 rounded-lg"
               style="background:#FFF3E0;border:1px solid #FB8C0040;color:#E65100">
            ⚠️ Les équipements <b>NOUVEAU DANS CIBLE</b> seront créés lors de l'application
            avec un <b>taux d'utilisation de 0%</b>. Le chef de service le mettra à jour ensuite.
          </div>

          <div class="flex items-center pt-3 border-t border-border">
            <button (click)="clearAll()"
                    class="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground flex items-center gap-1.5">
              <lucide-icon name="trash-2" class="w-3 h-3"></lucide-icon>Annuler tous
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResourceManagementPanelComponent implements OnChanges, OnInit {
  @Input() hospitals: Hospital[] = [];
  @Input() defaultHospitalId: number | null = null;
  @Input() isDirecteur: boolean = true;
  @Input() userServiceId: number | null = null;

  @Output() transferPlanified = new EventEmitter<TransferAction>();

  private api    = inject(ApiService);
  private http   = inject(HttpClient);      // ✅ AJOUT : pour appels API équipements
  private toasts = inject(ToastService);
  private store  = inject(SimulationStoreService);

  PRIMARY = PRIMARY;
  agentsSpecialises = AGENTS_SPECIALISES;

  readonly tabs = [
    { key: 'equipment', label: 'Équipements',       icon: 'settings' },
    { key: 'medecin',   label: 'Médecins',           icon: 'stethoscope' },
    { key: 'infirmier', label: 'Infirmiers',          icon: 'heart-pulse' },
    { key: 'agent',     label: 'Agents spécialisés', icon: 'users' },
  ];

  rootTab   = signal<string>('equipment');
  transfers = signal<TransferAction[]>([]);

  selectedHospitalId: number | null = null;
  services: Service[] = [];

  // ✅ CORRECTION : ajout des champs pour chargement API et détection nouveauté
  eq = {
    fromServiceId:    null as number | null,
    toServiceId:      null as number | null,
    sourceEquipment:  [] as any[],
    targetEquipment:  [] as any[],       // équipements du service cible
    equipmentId:      null as number | null,
    quantity:         1,
    loadingEquipment: false,
    isNewInTarget:    false,             // directeur : équipement absent dans la cible
    isNewInTargetChef: false,            // chef de service : équipement absent dans son service
  };
  staff = { fromServiceId: null as number|null, toServiceId: null as number|null, count: 1 };
  agent = { fromServiceId: null as number|null, toServiceId: null as number|null, type: AGENTS_SPECIALISES[0], count: 1 };

  ngOnInit()               { this.applyDefault(); }
  ngOnChanges(c: SimpleChanges) { if (c['defaultHospitalId']) this.applyDefault(); }

  private applyDefault() {
    if (this.defaultHospitalId != null && this.selectedHospitalId == null) {
      this.selectedHospitalId = this.defaultHospitalId;
      this.loadServices(this.defaultHospitalId);
    }
  }

  onHospitalChange(id: number | null) {
    this.selectedHospitalId = id;
    this.services = [];
    this.resetForms();
    if (id != null) this.loadServices(id);
  }

  private loadServices(id: number) {
    this.api.listServices(id).subscribe({ next: s => this.services = s, error: () => {} });
  }

  private resetForms() {
    this.eq    = { fromServiceId: null, toServiceId: null, sourceEquipment: [], targetEquipment: [], equipmentId: null, quantity: 1, loadingEquipment: false, isNewInTarget: false, isNewInTargetChef: false };
    this.staff = { fromServiceId: null, toServiceId: null, count: 1 };
    this.agent = { fromServiceId: null, toServiceId: null, type: AGENTS_SPECIALISES[0], count: 1 };
  }

  servicesFiltered(excludeId: number | null): Service[] {
    return this.services.filter(s => s.id !== excludeId);
  }

  // ✅ CORRECTION PRINCIPALE : charger depuis la BDD via GET /services/{id}/equipments
  onEqFromService(id: number | null) {
    this.eq.sourceEquipment = [];
    this.eq.equipmentId     = null;
    this.eq.toServiceId     = null;
    this.eq.isNewInTarget   = false;
    if (!id) return;

    this.eq.loadingEquipment = true;
    this.http.get<any[]>(`${BASE}/services/${id}/equipments`).subscribe({
      next: (list) => {
        // Normaliser : la table service_equipments utilise 'quantite'/'statut' (français)
        // mais on accepte aussi 'quantity'/'status' (anglais) pour compatibilité
        this.eq.sourceEquipment = list.map(e => ({
          ...e,
          quantity: e.quantity ?? e.quantite ?? 0,
          status:   e.status  ?? e.statut   ?? 'operationnel',
        })).filter(e =>
          !e.statut || e.statut === 'operationnel' ||
          !e.status || e.status === 'operational'  || e.status === 'operationnel'
        );
        this.eq.loadingEquipment = false;
      },
      error: () => {
        // Fallback sur les données déjà chargées dans l'objet service
        const svc = this.services.find(s => s.id === id);
        const raw = svc?.equipment ?? [];
        this.eq.sourceEquipment = raw.map((e: any) => ({
          ...e,
          quantity: e.quantity ?? e.quantite ?? 0,
          status:   e.status  ?? e.statut   ?? 'operationnel',
        }));
        this.eq.loadingEquipment = false;
      }
    });
  }

  // ✅ NOUVEAU : charger équipements du service cible pour détecter si l'équipement y existe
  onEqToService(toId: number | null) {
    this.eq.targetEquipment = [];
    this.eq.isNewInTarget   = false;
    if (!toId) return;

    this.http.get<any[]>(`${BASE}/services/${toId}/equipments`).subscribe({
      next:  (list) => { this.eq.targetEquipment = list; this.checkIsNewInTarget(); },
      error: () => {
        const svc = this.services.find(s => s.id === toId);
        this.eq.targetEquipment = svc?.equipment ?? [];
        this.checkIsNewInTarget();
      }
    });
  }

  // ✅ NOUVEAU : détecter si l'équipement sélectionné est absent dans la cible
  onEqSelected(id: number | null) {
    if (!id) { this.eq.isNewInTarget = false; return; }
    this.checkIsNewInTarget();
  }

  // Pour chef de service : charger équipements de son propre service
  onEqSelectedChef(id: number | null) {
    if (!id || !this.userServiceId) { this.eq.isNewInTargetChef = false; return; }
    const sel = this.eq.sourceEquipment.find(e => e.id === id);
    if (!sel) { this.eq.isNewInTargetChef = false; return; }

    this.http.get<any[]>(`${BASE}/services/${this.userServiceId}/equipments`).subscribe({
      next: (list) => {
        const exists = list.some(e =>
          (e.name ?? '').toLowerCase().trim() === (sel.name ?? '').toLowerCase().trim()
        );
        this.eq.isNewInTargetChef = !exists;
      },
      error: () => { this.eq.isNewInTargetChef = false; }
    });
  }

  private checkIsNewInTarget() {
    if (!this.eq.equipmentId || !this.eq.toServiceId) { this.eq.isNewInTarget = false; return; }
    const sel = this.eq.sourceEquipment.find(e => e.id === this.eq.equipmentId);
    if (!sel) { this.eq.isNewInTarget = false; return; }
    const exists = this.eq.targetEquipment.some(e =>
      (e.name ?? '').toLowerCase().trim() === (sel.name ?? '').toLowerCase().trim()
    );
    this.eq.isNewInTarget = !exists;
  }

  submitEqTransfer() {
    const x = this.eq;
    if (!x.fromServiceId || !x.toServiceId || !x.equipmentId) {
      this.toasts.show({ title: 'Champs requis', description: 'Remplissez tous les champs.', variant: 'destructive' }); return;
    }
    const sel     = x.sourceEquipment.find(e => e.id === x.equipmentId);
    const fromSvc = this.services.find(s => s.id === x.fromServiceId);
    const toSvc   = this.services.find(s => s.id === x.toServiceId);

    // ✅ VALIDATION : vérifier le stock disponible
    const stockDispo = sel?.quantity ?? sel?.quantite ?? 0;
    if (x.quantity < 1) {
      this.toasts.show({ title: 'Quantité invalide', description: 'La quantité doit être ≥ 1.', variant: 'destructive' }); return;
    }
    if (x.quantity > stockDispo) {
      this.toasts.show({
        title: 'Stock insuffisant',
        description: `${fromSvc?.name} n'a que ${stockDispo} × ${sel?.name ?? 'équipement'}. Vous avez saisi ${x.quantity}.`,
        variant: 'destructive'
      }); return;
    }

    this.addTransfer({
      type:           'equipment',
      label:          `${x.quantity} × ${sel?.name} : ${fromSvc?.name} → ${toSvc?.name}`,
      detail:         x.isNewInTarget
        ? `Sera créé dans ${toSvc?.name} (taux d'utilisation 0% — à ajuster après application)`
        : `Transfert d'équipement entre services`,
      isNewEquipment: x.isNewInTarget,
      data: {
        fromServiceId:         x.fromServiceId,
        toServiceId:           x.toServiceId,
        equipmentId:           x.equipmentId,
        equipmentName:         sel?.name,
        equipmentType:         sel?.type ?? 'medical',
        quantity:              x.quantity,
        isNewInTarget:         x.isNewInTarget,
        defaultUtilizationRate: x.isNewInTarget ? 0 : null,
      },
    });
    this.toasts.show({ title: 'Transfert planifié', description: `${x.quantity} × ${sel?.name} planifié.`, variant: 'success' });
    x.equipmentId = null; x.quantity = 1; x.isNewInTarget = false;
  }

  submitEqTransferChef() {
    const x = this.eq;
    if (!x.fromServiceId || !x.equipmentId) {
      this.toasts.show({ title: 'Champs requis', description: 'Sélectionnez un service et un équipement.', variant: 'destructive' }); return;
    }
    const sel     = x.sourceEquipment.find(e => e.id === x.equipmentId);
    const fromSvc = this.services.find(s => s.id === x.fromServiceId);

    // ✅ VALIDATION : vérifier le stock disponible
    const stockDispo = sel?.quantity ?? sel?.quantite ?? 0;
    if (x.quantity < 1) {
      this.toasts.show({ title: 'Quantité invalide', description: 'La quantité doit être ≥ 1.', variant: 'destructive' }); return;
    }
    if (x.quantity > stockDispo) {
      this.toasts.show({
        title: 'Stock insuffisant',
        description: `${fromSvc?.name} n'a que ${stockDispo} × ${sel?.name ?? 'équipement'}. Vous avez saisi ${x.quantity}.`,
        variant: 'destructive'
      }); return;
    }
    const toSvc = this.services.find(s => s.id === this.userServiceId);
    this.addTransfer({
      type:           'equipment',
      label:          `${x.quantity} × ${sel?.name} : ${fromSvc?.name} → ${toSvc?.name ?? 'Mon service'}`,
      detail:         x.isNewInTargetChef
        ? `Sera créé dans votre service (taux d'utilisation 0% — à ajuster après application)`
        : `Demande depuis ${fromSvc?.name} vers votre service`,
      isNewEquipment: x.isNewInTargetChef,
      data: {
        fromServiceId:         x.fromServiceId,
        toServiceId:           this.userServiceId,
        equipmentId:           x.equipmentId,
        equipmentName:         sel?.name,
        equipmentType:         sel?.type ?? 'medical',
        quantity:              x.quantity,
        isNewInTarget:         x.isNewInTargetChef,
        defaultUtilizationRate: x.isNewInTargetChef ? 0 : null,
      },
    });
    this.toasts.show({ title: 'Transfert planifié', description: `${x.quantity} × ${sel?.name} ajouté virtuellement.`, variant: 'success' });
    x.equipmentId = null; x.quantity = 1; x.isNewInTargetChef = false;
  }

  submitStaffTransfer(type: string) {
    const x = this.staff;
    if (!x.fromServiceId || !x.toServiceId) {
      this.toasts.show({ title: 'Champs requis', description: 'Service source et cible requis.', variant: 'destructive' }); return;
    }
    const fromSvc = this.services.find(s => s.id === x.fromServiceId);
    const toSvc   = this.services.find(s => s.id === x.toServiceId);
    const label   = type === 'medecin' ? 'médecin(s)' : 'infirmier(s)';
    this.addTransfer({
      type: type as any,
      label: `${x.count} ${label} : ${fromSvc?.name} → ${toSvc?.name}`,
      detail: `Redistribution de ${label} entre services`,
      data: { fromServiceId: x.fromServiceId, toServiceId: x.toServiceId, staffType: type, count: x.count },
    });
    this.toasts.show({ title: 'Transfert planifié', description: `${x.count} ${label} planifié(s).`, variant: 'success' });
    x.count = 1;
  }

  submitAgentTransfer() {
    const x = this.agent;
    if (!x.fromServiceId || !x.toServiceId) {
      this.toasts.show({ title: 'Champs requis', description: 'Service source et cible requis.', variant: 'destructive' }); return;
    }
    const fromSvc = this.services.find(s => s.id === x.fromServiceId);
    const toSvc   = this.services.find(s => s.id === x.toServiceId);
    this.addTransfer({
      type: 'agent',
      label: `${x.count} ${x.type} : ${fromSvc?.name} → ${toSvc?.name}`,
      detail: `Transfert d'agent spécialisé`,
      data: { fromServiceId: x.fromServiceId, toServiceId: x.toServiceId, agentType: x.type, count: x.count },
    });
    this.toasts.show({ title: 'Transfert planifié', description: `${x.count} ${x.type} planifié(s).`, variant: 'success' });
    x.count = 1;
  }

  submitStaffTransferChef(type: string) {
    const x = this.staff;
    if (!x.fromServiceId) {
      this.toasts.show({ title: 'Champs requis', description: 'Sélectionnez un service source.', variant: 'destructive' }); return;
    }
    const fromSvc = this.services.find(s => s.id === x.fromServiceId);
    const toSvc   = this.services.find(s => s.id === this.userServiceId);
    const label   = type === 'medecin' ? 'médecin(s)' : 'infirmier(s)';
    this.addTransfer({
      type: type as any,
      label: `${x.count} ${label} : ${fromSvc?.name} → ${toSvc?.name ?? 'Mon service'}`,
      detail: `Demande depuis ${fromSvc?.name} vers votre service`,
      data: { fromServiceId: x.fromServiceId, toServiceId: this.userServiceId, staffType: type, count: x.count },
    });
    this.toasts.show({ title: 'Transfert planifié', description: `${x.count} ${label} ajouté(s) virtuellement à votre service.`, variant: 'success' });
    x.count = 1;
  }

  private addTransfer(action: Omit<TransferAction, 'id'>) {
    const id = `trf_${Date.now()}`;
    const transfer: TransferAction = { ...action, id };
    this.transfers.update(arr => [...arr, transfer]);
    this.transferPlanified.emit(transfer);
    this.rootTab.set('journal');
  }

  removeTransfer(id: string) { this.transfers.update(arr => arr.filter(t => t.id !== id)); }

  clearAll() {
    if (!confirm('Annuler tous les transferts ?')) return;
    this.transfers.set([]);
    this.toasts.show({ title: 'Journal vidé', description: 'Tous les transferts annulés.', variant: 'default' });
  }

  hasNewEquipment(): boolean { return this.transfers().some(t => t.isNewEquipment); }

  transferColor(type: string): string {
    if (type === 'equipment') return PRIMARY;
    if (type === 'medecin')   return '#E53935';
    if (type === 'infirmier') return '#43A047';
    return '#FB8C00';
  }
  transferIcon(type: string): string {
    if (type === 'equipment') return 'settings';
    if (type === 'medecin')   return 'stethoscope';
    if (type === 'infirmier') return 'heart-pulse';
    return 'users';
  }
  transferTypeLabel(type: string): string {
    if (type === 'equipment') return 'Équipement';
    if (type === 'medecin')   return 'Médecin';
    if (type === 'infirmier') return 'Infirmier';
    return 'Agent spécialisé';
  }
}