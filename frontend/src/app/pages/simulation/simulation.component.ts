import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../shared/api.service';
import { Hospital, Service, Equipment } from '../../shared/models';
import {
  DEFAULT_INPUT, runSimulation, BASE_TOTAL_STAFF,
  PRIMARY, PRIMARY_DARK, RED,
} from '../../shared/simulation-engine';
import { SimulationStoreService } from '../../shared/simulation-store.service';
import { ToastService } from '../../shared/toast.service';
import { ResourceManagementPanelComponent } from '../../shared/resource-management-panel.component';

interface NewServiceDraftEquipment {
  name: string;
  type: string;
  quantity: number;
  status: 'operational' | 'maintenance' | 'broken';
}
interface NewServiceDraft {
  name: string;
  head: string;
  doctors: number;
  nurses: number;
  beds: number;
  equipment: NewServiceDraftEquipment[];
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
              <p class="text-sm text-muted-foreground">Gérez les services, transférez le personnel et l'équipement, puis lancez la simulation.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-6xl mx-auto space-y-5">

          <!-- Hospital selector -->
          <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div class="flex items-center gap-2 mb-3">
              <lucide-icon name="building-2" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
              <h2 class="font-bold text-foreground text-sm">Structure simulée</h2>
            </div>
            <select [ngModel]="hospitalId()" (ngModelChange)="onHospitalChange($event)"
                    class="w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                    data-testid="select-hospital">
              <option [ngValue]="null">— Sélectionner une structure —</option>
              <option *ngFor="let h of hospitals()" [ngValue]="h.id">{{ h.name }}</option>
            </select>
          </div>

          <!-- État actuel (read-only KPIs, kept as a quick overview) -->
          <div class="bg-card rounded-xl border-2 border-dashed border-muted shadow-sm p-4" data-testid="section-current-state">
            <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon>
              État actuel (lecture seule)
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div class="bg-muted/40 rounded-lg p-2.5">
                <div class="text-muted-foreground">Personnel total (base)</div>
                <div class="text-base font-bold text-foreground">{{ BASE_TOTAL_STAFF }}</div>
              </div>
              <div class="bg-muted/40 rounded-lg p-2.5">
                <div class="text-muted-foreground">Services affichés</div>
                <div class="text-base font-bold text-foreground">{{ services().length }}</div>
              </div>
              <div class="bg-muted/40 rounded-lg p-2.5">
                <div class="text-muted-foreground">Médecins (services)</div>
                <div class="text-base font-bold text-foreground">{{ totalDoctors() }}</div>
              </div>
              <div class="bg-muted/40 rounded-lg p-2.5">
                <div class="text-muted-foreground">Infirmiers (services)</div>
                <div class="text-base font-bold" [style.color]="PRIMARY_DARK">{{ totalNurses() }}</div>
              </div>
            </div>
          </div>

          <!-- =========================================================== -->
          <!-- SECTION 1 — Services de la structure                          -->
          <!-- =========================================================== -->
          <div class="flex items-center gap-2 mt-2 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">
              Services de la structure
            </h2>
          </div>

          <div *ngIf="hospitalId() === null"
               class="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sélectionnez une structure pour afficher ses services.
          </div>

          <div *ngIf="hospitalId() !== null && loading()" class="text-center text-sm text-muted-foreground py-6">
            Chargement des services...
          </div>

          <div *ngIf="hospitalId() !== null && !loading() && services().length === 0"
               class="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
               data-testid="services-empty">
            Aucun service. Cliquez sur « Ajouter un service » ci-dessous pour en créer un.
          </div>

          <!-- Service cards from API -->
          <div *ngFor="let svc of services(); trackBy: trackSvc" class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
               [attr.data-testid]="'service-card-' + svc.id">

            <!-- Card header -->
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
                    [style.color]="statusColor(svc.status)">
                {{ statusLabel(svc.status) }}
              </span>
            </div>

            <!-- A. Ressources humaines -->
            <div class="px-5 py-4 border-b border-border">
              <div class="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                   [style.color]="PRIMARY_DARK">
                <lucide-icon name="users" class="w-3.5 h-3.5"></lucide-icon>
                A. Ressources humaines
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Médecins slider -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-muted-foreground">Nombre de médecins</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" (click)="bump(svc, 'doctors', -1, 50)"
                              class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none"
                              [attr.data-testid]="'svc-doctors-dec-' + svc.id">−</button>
                      <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK"
                            [attr.data-testid]="'svc-doctors-val-' + svc.id">{{ svc.doctors }}</span>
                      <button type="button" (click)="bump(svc, 'doctors', +1, 50)"
                              class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none"
                              [attr.data-testid]="'svc-doctors-inc-' + svc.id">+</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="50" step="1" [(ngModel)]="svc.doctors"
                         class="hs-range w-full"
                         [style.--c]="PRIMARY"
                         [attr.data-testid]="'svc-doctors-' + svc.id" />
                </div>
                <!-- Infirmiers slider -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-muted-foreground">Nombre d'infirmiers</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" (click)="bump(svc, 'nurses', -1, 100)"
                              class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none"
                              [attr.data-testid]="'svc-nurses-dec-' + svc.id">−</button>
                      <span class="min-w-[2rem] text-center text-sm font-bold" [style.color]="PRIMARY_DARK"
                            [attr.data-testid]="'svc-nurses-val-' + svc.id">{{ svc.nurses }}</span>
                      <button type="button" (click)="bump(svc, 'nurses', +1, 100)"
                              class="w-6 h-6 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm leading-none"
                              [attr.data-testid]="'svc-nurses-inc-' + svc.id">+</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="100" step="1" [(ngModel)]="svc.nurses"
                         class="hs-range w-full"
                         [style.--c]="PRIMARY"
                         [attr.data-testid]="'svc-nurses-' + svc.id" />
                </div>
              </div>
              <div class="text-[11px] text-muted-foreground mt-3">
                Faites glisser les curseurs ou utilisez +/− pour ajuster. Pour transférer du personnel entre services ou structures, utilisez la section « Gestion des transferts » ci-dessous.
              </div>
            </div>

            <!-- B. Ressources matérielles -->
            <div class="px-5 py-4 border-b border-border">
              <div class="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
                   [style.color]="PRIMARY_DARK">
                <lucide-icon name="wrench" class="w-3.5 h-3.5"></lucide-icon>
                B. Ressources matérielles (équipements)
              </div>
              <div *ngIf="(svc.equipment || []).length === 0"
                   class="text-xs text-muted-foreground italic py-2">
                Aucun équipement enregistré pour ce service.
              </div>
              <div *ngIf="equipmentGroups(svc).length > 0" class="space-y-2">
                <div *ngFor="let g of equipmentGroups(svc); trackBy: trackGroup"
                     class="px-3 py-2.5 rounded-md bg-muted/30 border border-border/60"
                     [attr.data-testid]="'equipment-group-' + svc.id + '-' + g.slug">
                  <div class="flex items-start justify-between gap-3 text-xs flex-wrap">
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-foreground">{{ g.name }} <span class="text-muted-foreground font-normal">— {{ g.type }}</span></div>
                      <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                        <span class="inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full" style="background:#43A047"></span>
                          <b class="text-foreground"
                             [attr.data-testid]="'eq-op-' + svc.id + '-' + g.slug">{{ g.operational }}</b>
                          opérationnel{{ g.operational > 1 ? 's' : '' }}
                        </span>
                        <span class="inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full" style="background:#FB8C00"></span>
                          <b class="text-foreground">{{ g.maintenance }}</b> maintenance
                        </span>
                        <span class="inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full" style="background:#E53935"></span>
                          <b class="text-foreground">{{ g.broken }}</b> hors service
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <button type="button" (click)="bumpEqGroup(svc, g, -1, 50)"
                              class="w-5 h-5 rounded border border-border bg-background hover:bg-muted text-foreground text-xs leading-none"
                              [attr.data-testid]="'eq-dec-' + svc.id + '-' + g.slug">−</button>
                      <span class="min-w-[2rem] text-center font-bold text-foreground"
                            [attr.data-testid]="'eq-val-' + svc.id + '-' + g.slug">{{ g.operational }}</span>
                      <button type="button" (click)="bumpEqGroup(svc, g, +1, 50)"
                              class="w-5 h-5 rounded border border-border bg-background hover:bg-muted text-foreground text-xs leading-none"
                              [attr.data-testid]="'eq-inc-' + svc.id + '-' + g.slug">+</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="50" step="1"
                         [ngModel]="g.operational"
                         (ngModelChange)="setEqGroupOperational(svc, g, $event)"
                         class="hs-range w-full mt-2"
                         [style.--c]="PRIMARY"
                         [attr.data-testid]="'eq-qty-' + svc.id + '-' + g.slug" />
                  <div class="text-[10px] text-muted-foreground mt-1 italic">
                    Le curseur ajuste uniquement la quantité opérationnelle. Les unités en maintenance ou hors service restent inchangées.
                  </div>
                </div>
              </div>
            </div>

            <!-- C. Action: Supprimer le service -->
            <div class="px-5 py-3 bg-muted/20 flex justify-end">
              <button (click)="deleteService(svc)"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors"
                      [style.backgroundColor]="RED"
                      [attr.data-testid]="'btn-delete-service-' + svc.id">
                <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
                Supprimer le service
              </button>
            </div>
          </div>

          <!-- "Ajouter un service" — at the BOTTOM of the services list -->
          <div *ngIf="hospitalId() !== null"
               class="flex justify-center pt-2">
            <button (click)="openAddService()"
                    class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                    [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'"
                    data-testid="btn-add-service">
              <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
              Ajouter un service
            </button>
          </div>

          <!-- =========================================================== -->
          <!-- SECTION 2 — Gestion des transferts (separate box)             -->
          <!-- =========================================================== -->
          <div class="flex items-center gap-2 mt-6 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">
              Gestion des transferts
            </h2>
          </div>
          <app-resource-management-panel
            [hospitals]="hospitals()"
            [defaultHospitalId]="hospitalId()">
          </app-resource-management-panel>

          <!-- =========================================================== -->
          <!-- SECTION 3 — Lancer la simulation                              -->
          <!-- =========================================================== -->
          <div class="flex items-center gap-2 mt-6 px-1">
            <span class="w-1.5 h-5 rounded-full" [style.backgroundColor]="PRIMARY"></span>
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">
              Lancer la simulation
            </h2>
          </div>
          <button (click)="runSim()" [disabled]="running()"
                  class="w-full py-4 rounded-2xl text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                  [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'"
                  data-testid="btn-run-simulation">
            <lucide-icon [name]="running() ? 'loader-2' : 'play-circle'" class="w-6 h-6" [class.animate-spin]="running()"></lucide-icon>
            {{ running() ? 'Simulation en cours…' : 'Lancer la simulation' }}
          </button>

        </div>
      </div>
    </div>

    <!-- ===== ADD SERVICE MODAL ===== -->
    <div *ngIf="addServiceOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
         data-testid="dialog-add-service" (click)="closeAddService()">
      <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">
        <div class="px-5 py-4 text-white" [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
              <h3 class="font-bold">Ajouter un service</h3>
            </div>
            <button (click)="closeAddService()" class="p-1 hover:bg-white/20 rounded" data-testid="btn-close-add-service">
              <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          <p class="text-xs text-white/80 mt-1">Renseignez les informations du nouveau service</p>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom du service *</span>
              <input [(ngModel)]="svcDraft.name" type="text"
                     class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                     placeholder="Ex. Cardiologie" data-testid="dialog-svc-name" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chef de service *</span>
              <input [(ngModel)]="svcDraft.head" type="text"
                     class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                     placeholder="Ex. Mansouri" data-testid="dialog-svc-head" />
            </label>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <label class="block">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Médecins</span>
              <input [(ngModel)]="svcDraft.doctors" type="number" min="0"
                     class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                     data-testid="dialog-svc-doctors" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infirmiers</span>
              <input [(ngModel)]="svcDraft.nurses" type="number" min="0"
                     class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                     data-testid="dialog-svc-nurses" />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lits</span>
              <input [(ngModel)]="svcDraft.beds" type="number" min="0"
                     class="mt-1 w-full text-sm px-3 py-2 rounded-md border border-border bg-background"
                     data-testid="dialog-svc-beds" />
            </label>
          </div>

          <div class="border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-foreground">Équipements</span>
              <button (click)="addSvcEq()" type="button"
                      class="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-md text-white"
                      [style.backgroundColor]="PRIMARY" data-testid="dialog-svc-add-eq">
                <lucide-icon name="plus" class="w-3 h-3"></lucide-icon>
                Ajouter un équipement
              </button>
            </div>
            <div *ngIf="svcDraft.equipment.length === 0" class="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
              Aucun équipement ajouté
            </div>
            <div *ngFor="let eq of svcDraft.equipment; let i = index"
                 class="grid grid-cols-12 gap-2 mb-2 items-center"
                 [attr.data-testid]="'dialog-svc-eq-row-' + i">
              <input [(ngModel)]="eq.name" type="text" placeholder="Nom"
                     class="col-span-4 px-2 py-1.5 rounded-md border border-border bg-background text-xs"
                     [attr.data-testid]="'dialog-svc-eq-name-' + i" />
              <input [(ngModel)]="eq.type" type="text" placeholder="Type"
                     class="col-span-3 px-2 py-1.5 rounded-md border border-border bg-background text-xs"
                     [attr.data-testid]="'dialog-svc-eq-type-' + i" />
              <input [(ngModel)]="eq.quantity" type="number" min="1" placeholder="Qté"
                     class="col-span-2 px-2 py-1.5 rounded-md border border-border bg-background text-xs"
                     [attr.data-testid]="'dialog-svc-eq-qty-' + i" />
              <div class="col-span-2 px-2 py-1.5 rounded-md border border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 text-center"
                   [attr.data-testid]="'dialog-svc-eq-status-' + i">
                opérationnel
              </div>
              <button (click)="removeSvcEq(i)" type="button"
                      class="col-span-1 p-1 hover:bg-muted rounded text-muted-foreground"
                      [attr.data-testid]="'dialog-svc-eq-remove-' + i" aria-label="Supprimer">
                <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button (click)="closeAddService()" class="px-4 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted"
                  data-testid="btn-cancel-add-service">
            Annuler
          </button>
          <button (click)="confirmAddService()" class="px-4 py-2 text-sm rounded-md text-white font-semibold flex items-center gap-1.5"
                  [style.background]="'linear-gradient(135deg, ' + PRIMARY + ', ' + PRIMARY_DARK + ')'"
                  data-testid="btn-submit-add-service">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
            Créer le service
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SimulationComponent implements OnInit {
  private api = inject(ApiService);
  private store = inject(SimulationStoreService);
  private toasts = inject(ToastService);
  private router = inject(Router);

  PRIMARY = PRIMARY; PRIMARY_DARK = PRIMARY_DARK; RED = RED;
  BASE_TOTAL_STAFF = BASE_TOTAL_STAFF;

  hospitals = signal<Hospital[]>([]);
  hospitalId = signal<number | null>(null);
  services = signal<Service[]>([]);
  loading = signal(false);
  running = signal(false);

  // Memoized equipment groups by service id — recomputed only when services() changes.
  private groupsByService = computed<Map<number, Array<{ name: string; type: string; operational: number; maintenance: number; broken: number; slug: string }>>>(() => {
    const m = new Map<number, Array<{ name: string; type: string; operational: number; maintenance: number; broken: number; slug: string }>>();
    for (const svc of this.services()) {
      const groups = new Map<string, { name: string; type: string; operational: number; maintenance: number; broken: number; slug: string }>();
      for (const eq of svc.equipment || []) {
        let g = groups.get(eq.name);
        if (!g) {
          g = { name: eq.name, type: eq.type, operational: 0, maintenance: 0, broken: 0, slug: this.slugify(eq.name) };
          groups.set(eq.name, g);
        }
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

  ngOnInit() {
    this.api.listHospitals().subscribe({
      next: (h) => {
        this.hospitals.set(h);
        if (h.length > 0) {
          this.hospitalId.set(h[0].id);
          this.loadServices(h[0].id);
        }
      },
      error: () => {},
    });
  }

  onHospitalChange(id: number | null) {
    this.hospitalId.set(id);
    if (id == null) { this.services.set([]); return; }
    this.loadServices(id);
  }

  loadServices(id: number) {
    this.loading.set(true);
    this.api.listServices(id).subscribe({
      next: (s) => { this.services.set(s); this.loading.set(false); },
      error: () => { this.services.set([]); this.loading.set(false); },
    });
  }

  totalDoctors(): number { return this.services().reduce((a, s) => a + (Number(s.doctors) || 0), 0); }
  totalNurses(): number { return this.services().reduce((a, s) => a + (Number(s.nurses) || 0), 0); }

  bump(svc: Service, key: 'doctors' | 'nurses', delta: number, max: number) {
    const cur = Number(svc[key]) || 0;
    const next = Math.min(max, Math.max(0, cur + delta));
    svc[key] = next;
    this.services.set([...this.services()]);
  }
  // ===== Equipment grouping (memoized via groupsByService computed signal) =====
  equipmentGroups(svc: Service) { return this.groupsByService().get(svc.id) || []; }
  private slugify(s: string): string { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  // Stable trackBy functions to avoid full DOM rebuilds on slider movement.
  trackSvc = (_: number, s: Service) => s.id;
  trackGroup = (_: number, g: { slug: string }) => g.slug;

  setEqGroupOperational(svc: Service, g: { name: string; type: string }, value: number) {
    const next = Math.min(50, Math.max(0, Number(value) || 0));
    const opEntry = (svc.equipment || []).find(e => e.name === g.name && e.status === 'operational');
    if (opEntry) {
      if (opEntry.quantity === next) return; // no-op short-circuit prevents redundant CD churn
      opEntry.quantity = next;
    } else if (next > 0) {
      const maxId = (svc.equipment || []).reduce((m, e) => Math.max(m, e.id), 0);
      const newId = (maxId || 0) * 1000 + Math.floor(Math.random() * 999) + 1;
      svc.equipment = [...(svc.equipment || []), { id: newId, serviceId: svc.id, name: g.name, type: g.type, quantity: next, status: 'operational' } as Equipment];
    } else {
      return;
    }
    // Replace the single mutated service so the computed cache invalidates only its entry.
    this.services.set(this.services().map(s => s.id === svc.id ? { ...svc } : s));
  }
  bumpEqGroup(svc: Service, g: { name: string; type: string; operational: number }, delta: number, max: number) {
    this.setEqGroupOperational(svc, g, Math.min(max, Math.max(0, g.operational + delta)));
  }

  // ===== Add Service =====
  emptySvcDraft(): NewServiceDraft {
    return { name: '', head: '', doctors: 0, nurses: 0, beds: 0, equipment: [] };
  }
  openAddService() { this.svcDraft = this.emptySvcDraft(); this.addServiceOpen.set(true); }
  closeAddService() { this.addServiceOpen.set(false); }
  addSvcEq() { this.svcDraft.equipment.push({ name: '', type: '', quantity: 1, status: 'operational' }); }
  removeSvcEq(i: number) { this.svcDraft.equipment.splice(i, 1); }

  confirmAddService() {
    const id = this.hospitalId();
    if (id == null) {
      this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez une structure avant d\'ajouter un service.', variant: 'destructive' });
      return;
    }
    const d = this.svcDraft;
    if (!d.name.trim() || !d.head.trim()) {
      this.toasts.show({ title: 'Champs requis', description: 'Le nom du service et le chef de service sont obligatoires.', variant: 'destructive' });
      return;
    }
    const payload = {
      name: d.name.trim(),
      head: d.head.trim(),
      doctors: Number(d.doctors) || 0,
      nurses: Number(d.nurses) || 0,
      beds: Number(d.beds) || 0,
      equipment: d.equipment
        .filter(e => e.name.trim().length > 0)
        .map(e => ({
          name: e.name.trim(),
          type: e.type.trim() || '—',
          quantity: Math.max(1, Number(e.quantity) || 1),
          status: 'operational' as const,
        })),
    };
    this.api.createService(id, payload).subscribe({
      next: () => {
        this.toasts.show({ title: 'Service ajouté', description: `${payload.name} a été créé.`, variant: 'success' });
        this.addServiceOpen.set(false);
        this.loadServices(id);
      },
      error: () => {
        // API may not support full create — fall back to local insert so the flow is not broken.
        const list = this.services();
        const newId = (list.reduce((m, s) => Math.max(m, s.id), 0) || 0) + 1;
        const eqList: Equipment[] = payload.equipment.map((e, i) => ({
          id: newId * 1000 + i + 1,
          serviceId: newId,
          name: e.name, type: e.type, quantity: e.quantity, status: e.status,
        }));
        const newSvc: Service = {
          id: newId, hospitalId: id, name: payload.name, head: payload.head,
          doctors: payload.doctors, nurses: payload.nurses,
          beds: payload.beds, availableBeds: payload.beds, patients: 0,
          status: 'normal', equipment: eqList,
        };
        this.services.set([...list, newSvc]);
        this.toasts.show({ title: 'Service ajouté (local)', description: `${payload.name} a été ajouté localement.`, variant: 'default' });
        this.addServiceOpen.set(false);
      },
    });
  }

  // ===== Delete Service =====
  deleteService(svc: Service) {
    const ok = confirm(`Supprimer le service « ${svc.name} » ? Cette action libère ses ressources.`);
    if (!ok) return;
    this.api.deleteService(svc.id).subscribe({
      next: () => {
        this.toasts.show({ title: 'Service supprimé', description: `${svc.name} a été supprimé.`, variant: 'success' });
        const id = this.hospitalId();
        if (id != null) this.loadServices(id);
      },
      error: () => {
        // Fallback: remove locally so the UI reflects the action.
        this.services.set(this.services().filter(s => s.id !== svc.id));
        this.toasts.show({ title: 'Service retiré (local)', description: `${svc.name} a été retiré de la liste.`, variant: 'default' });
      },
    });
  }

  // ===== Run simulation =====
 runSim() {
  const id = this.hospitalId();
  if (id == null) {
    this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez une structure avant de lancer la simulation.', variant: 'destructive' });
    return;
  }

  this.running.set(true);

  const totalDoctors = this.totalDoctors();
  const totalNurses = this.totalNurses();
  const totalBeds = this.services().reduce((a, s) => a + (Number(s.beds) || 0), 0);
  const totalEquipment = this.services().reduce((a, s) => a + (s.equipment || []).length, 0);

  const payload = {
    hospital_id: id,
    scenario_name: `Scénario - ${new Date().toLocaleDateString('fr-FR')}`,
    target_doctors: totalDoctors,
    target_nurses: totalNurses,
    target_beds: totalBeds,
    available_equipment: totalEquipment,
  };

  this.api.runSimulation(payload).subscribe({
    next: (result: any) => {
      this.store.set({ input: payload, result });
      this.running.set(false);
      this.toasts.show({ title: 'Simulation terminée', description: 'Voir les résultats.', variant: 'success' });
      this.router.navigate(['/simulation-result']);
    },
    error: () => {
      this.running.set(false);
      this.toasts.show({ title: 'Erreur', description: 'Impossible de lancer la simulation.', variant: 'destructive' });
    },
  });
}

  // ===== Display helpers =====
  statusColor(s: string): string {
    if (s === 'critical') return '#E53935';
    if (s === 'medium' || s === 'high') return '#FB8C00';
    return '#43A047';
  }
  statusLabel(s: string): string {
    if (s === 'critical') return 'Critique';
    if (s === 'medium' || s === 'high') return 'Moyenne';
    return 'Normale';
  }
  eqColor(s: string): string {
    return s === 'operational' ? '#43A047' : s === 'maintenance' ? '#FB8C00' : '#E53935';
  }
  eqLabel(s: string): string {
    return s === 'operational' ? 'Opérationnel' : s === 'maintenance' ? 'Maintenance' : 'Hors service';
  }
}
