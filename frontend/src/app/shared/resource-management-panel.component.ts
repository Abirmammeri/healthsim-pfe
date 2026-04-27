import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from './api.service';
import { Hospital, Service, Equipment } from './models';
import { PRIMARY } from './simulation-engine';
import { ToastService } from './toast.service';

const SPECIALTIES = [
  'Cardiologie', 'Neurologie', 'Pneumologie', 'Gastroentérologie',
  'Néphrologie', 'Endocrinologie', 'Oncologie', 'Pédiatrie',
  'Gynécologie', 'Psychiatrie', 'Dermatologie', 'Rhumatologie',
];

interface SpecialistAction {
  id: string;
  fromHospitalId: number;
  fromHospitalName: string;
  toHospitalId: number;
  toHospitalName: string;
  specialty: string;
  count: number;
}

@Component({
  selector: 'app-resource-management-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" data-testid="resource-management-panel">
      <div class="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <lucide-icon name="arrow-left-right" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
        <h2 class="font-bold text-foreground text-sm">Gestion des ressources</h2>
        <span class="ml-auto text-[11px] text-muted-foreground">Transferts entre services et structures</span>
      </div>

      <!-- Outer tabs -->
      <div class="flex border-b border-border bg-card">
        <button (click)="rootTab.set('equipment')"
                [class.text-foreground]="rootTab() === 'equipment'"
                [class.text-muted-foreground]="rootTab() !== 'equipment'"
                [style.borderBottomColor]="rootTab() === 'equipment' ? PRIMARY : 'transparent'"
                class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors hover:bg-muted/30"
                data-testid="rmp-tab-equipment">
          <lucide-icon name="wrench" class="w-3.5 h-3.5 inline mr-1.5"></lucide-icon>
          Ressources matérielles
        </button>
        <button (click)="rootTab.set('staff')"
                [class.text-foreground]="rootTab() === 'staff'"
                [class.text-muted-foreground]="rootTab() !== 'staff'"
                [style.borderBottomColor]="rootTab() === 'staff' ? PRIMARY : 'transparent'"
                class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors hover:bg-muted/30"
                data-testid="rmp-tab-staff">
          <lucide-icon name="users" class="w-3.5 h-3.5 inline mr-1.5"></lucide-icon>
          Ressources humaines
        </button>
      </div>

      <!-- ============ EQUIPMENT TAB ============ -->
      <div *ngIf="rootTab() === 'equipment'" class="p-4 space-y-3">
        <div class="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
          <button (click)="setEqMode('same-hospital')"
                  [class.bg-card]="eqMode() === 'same-hospital'"
                  [class.shadow-sm]="eqMode() === 'same-hospital'"
                  class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                  data-testid="rmp-eq-trf-svc">
            Entre services
          </button>
          <button (click)="setEqMode('cross-hospital')"
                  [class.bg-card]="eqMode() === 'cross-hospital'"
                  [class.shadow-sm]="eqMode() === 'cross-hospital'"
                  class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                  data-testid="rmp-eq-trf-hosp">
            Entre structures
          </button>
        </div>

        <div class="space-y-3" [attr.data-testid]="'rmp-form-eq-trf-' + eqMode()">
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure source</span>
              <select [(ngModel)]="eq.fromHospitalId" (ngModelChange)="onEqFromHospital($event)"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid="rmp-eq-trf-hosp-from">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
              </select>
            </label>
            <label class="block" *ngIf="eqMode() === 'cross-hospital'">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure cible</span>
              <select [(ngModel)]="eq.toHospitalId" (ngModelChange)="onEqToHospital($event)"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid="rmp-eq-trf-hosp-to">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
              </select>
            </label>
            <div *ngIf="eqMode() === 'same-hospital'" class="text-[11px] text-muted-foreground self-end pb-2">
              Transfert au sein de la même structure.
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service source</span>
              <select [(ngModel)]="eq.fromServiceId" (ngModelChange)="onEqFromService($event)"
                      [disabled]="!eq.fromHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50"
                      data-testid="rmp-eq-trf-svc-from">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of eq.fromServices" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service cible</span>
              <select [(ngModel)]="eq.toServiceId"
                      [disabled]="!effectiveEqToHospitalId()"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50"
                      data-testid="rmp-eq-trf-svc-to">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of eqToServicesFiltered()" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
          </div>

          <div class="grid grid-cols-12 gap-2 items-end">
            <label class="col-span-7 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Équipement à transférer</span>
              <select [(ngModel)]="eq.equipmentId"
                      [disabled]="eq.sourceEquipment.length === 0"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50"
                      data-testid="rmp-eq-trf-equipment">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let e of eq.sourceEquipment" [ngValue]="e.id">
                  {{ e.name }} (×{{ e.quantity }})
                </option>
              </select>
            </label>
            <label class="col-span-2 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Qté</span>
              <input type="number" min="1" [(ngModel)]="eq.quantity"
                     class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                     data-testid="rmp-eq-trf-quantity" />
            </label>
            <button (click)="submitEqTransfer()"
                    [disabled]="eqSubmitting()"
                    class="col-span-3 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                    [style.backgroundColor]="PRIMARY"
                    data-testid="rmp-eq-trf-submit">
              <lucide-icon name="arrow-left-right" class="w-3.5 h-3.5"></lucide-icon>
              Transférer
            </button>
          </div>
        </div>
      </div>

      <!-- ============ STAFF TAB ============ -->
      <div *ngIf="rootTab() === 'staff'" class="p-4 space-y-3">
        <div class="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
          <button (click)="staffMode.set('nurse')"
                  [class.bg-card]="staffMode() === 'nurse'"
                  [class.shadow-sm]="staffMode() === 'nurse'"
                  class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                  data-testid="rmp-tab-staff-nurse">
            Infirmiers
          </button>
          <button (click)="staffMode.set('doctor')"
                  [class.bg-card]="staffMode() === 'doctor'"
                  [class.shadow-sm]="staffMode() === 'doctor'"
                  class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                  data-testid="rmp-tab-staff-doctor-gen">
            Médecins généralistes
          </button>
          <button (click)="staffMode.set('specialist')"
                  [class.bg-card]="staffMode() === 'specialist'"
                  [class.shadow-sm]="staffMode() === 'specialist'"
                  class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                  data-testid="rmp-tab-staff-doctor-spec">
            Médecins spécialisés
          </button>
        </div>

        <!-- Nurse / Doctor general -->
        <div *ngIf="staffMode() !== 'specialist'" class="space-y-3" [attr.data-testid]="'rmp-form-staff-' + staffMode()">
          <div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <lucide-icon [name]="staffMode() === 'nurse' ? 'heart-pulse' : 'stethoscope'" class="w-3.5 h-3.5" [style.color]="PRIMARY"></lucide-icon>
            Redistribution des {{ staffMode() === 'nurse' ? 'infirmiers' : 'médecins généralistes' }} entre services d'une même structure.
          </div>
          <div class="grid grid-cols-3 gap-2">
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure</span>
              <select [(ngModel)]="staff.hospitalId" (ngModelChange)="onStaffHospital($event)"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      [attr.data-testid]="'rmp-staff-' + staffMode() + '-hosp'">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service source</span>
              <select [(ngModel)]="staff.fromId" (ngModelChange)="onStaffFromService($event)"
                      [disabled]="!staff.hospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50"
                      [attr.data-testid]="'rmp-staff-' + staffMode() + '-from'">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of staff.services" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Service cible</span>
              <select [(ngModel)]="staff.toId"
                      [disabled]="!staff.hospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background disabled:opacity-50"
                      [attr.data-testid]="'rmp-staff-' + staffMode() + '-to'">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let s of staffToServicesFiltered()" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-8 text-[11px] text-muted-foreground">
              <ng-container *ngIf="staffFromService() as fs">
                Disponible dans <b class="text-foreground">{{ fs.name }}</b> :
                <b class="text-foreground">{{ staffMode() === 'nurse' ? fs.nurses : fs.doctors }}</b>
                {{ staffMode() === 'nurse' ? 'infirmiers' : 'médecins généralistes' }}
              </ng-container>
              <ng-container *ngIf="!staffFromService()">
                Sélectionnez un service source pour voir les effectifs disponibles.
              </ng-container>
            </div>
            <input type="number" min="1" [(ngModel)]="staff.count"
                   class="col-span-2 text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                   [attr.data-testid]="'rmp-staff-' + staffMode() + '-count'" />
            <button (click)="submitStaffTransfer()"
                    [disabled]="staffSubmitting()"
                    class="col-span-2 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                    [style.backgroundColor]="PRIMARY"
                    [attr.data-testid]="'rmp-staff-' + staffMode() + '-submit'">
              <lucide-icon name="arrow-left-right" class="w-3.5 h-3.5"></lucide-icon>
              Transférer
            </button>
          </div>
        </div>

        <!-- Specialist (frontend-only planned) -->
        <div *ngIf="staffMode() === 'specialist'" class="space-y-3" data-testid="rmp-form-staff-doctors-spec">
          <div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <lucide-icon name="graduation-cap" class="w-3.5 h-3.5" [style.color]="PRIMARY"></lucide-icon>
            Transfert de médecins spécialisés entre structures (action de simulation).
          </div>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure source</span>
              <select [(ngModel)]="spec.fromHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid="rmp-spec-hosp-from">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Structure cible</span>
              <select [(ngModel)]="spec.toHospitalId"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid="rmp-spec-hosp-to">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let h of hospitals" [ngValue]="h.id">{{ h.name }}</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-12 gap-2 items-end">
            <label class="col-span-6 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Spécialité</span>
              <select [(ngModel)]="spec.specialty"
                      class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid="rmp-spec-specialty">
                <option *ngFor="let s of specialties" [value]="s">{{ s }}</option>
              </select>
            </label>
            <label class="col-span-3 block">
              <span class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nombre</span>
              <input type="number" min="1" [(ngModel)]="spec.count"
                     class="mt-1 w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background"
                     data-testid="rmp-spec-count" />
            </label>
            <button (click)="submitSpecialistTransfer()"
                    class="col-span-3 text-xs px-3 py-1.5 rounded-md text-white font-semibold flex items-center justify-center gap-1.5"
                    [style.backgroundColor]="PRIMARY"
                    data-testid="rmp-spec-submit">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
              Transférer
            </button>
          </div>

          <div *ngIf="specialistActions().length > 0" class="border-t border-border pt-2">
            <div class="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Transferts planifiés</div>
            <ul class="space-y-1">
              <li *ngFor="let a of specialistActions()"
                  class="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-md bg-muted/40 border border-border/60"
                  [attr.data-testid]="'rmp-spec-action-' + a.id">
                <span>
                  <b>{{ a.count }}</b> {{ a.specialty }} :
                  <b>{{ a.fromHospitalName }}</b> → <b>{{ a.toHospitalName }}</b>
                </span>
                <button (click)="removeSpecialistAction(a.id)"
                        class="p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer"
                        [attr.data-testid]="'rmp-spec-remove-' + a.id">
                  <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResourceManagementPanelComponent implements OnChanges, OnInit {
  @Input() hospitals: Hospital[] = [];
  @Input() defaultHospitalId: number | null = null;

  private api = inject(ApiService);
  private toasts = inject(ToastService);

  PRIMARY = PRIMARY;
  specialties = SPECIALTIES;

  rootTab = signal<'equipment' | 'staff'>('equipment');
  eqMode = signal<'same-hospital' | 'cross-hospital'>('same-hospital');
  staffMode = signal<'nurse' | 'doctor' | 'specialist'>('nurse');

  eq = {
    fromHospitalId: null as number | null,
    toHospitalId: null as number | null,
    fromServiceId: null as number | null,
    toServiceId: null as number | null,
    fromServices: [] as Service[],
    toServices: [] as Service[],
    sourceEquipment: [] as Equipment[],
    equipmentId: null as number | null,
    quantity: 1,
  };
  eqSubmitting = signal(false);

  staff = {
    hospitalId: null as number | null,
    services: [] as Service[],
    fromId: null as number | null,
    toId: null as number | null,
    count: 1,
  };
  staffSubmitting = signal(false);

  spec = {
    fromHospitalId: null as number | null,
    toHospitalId: null as number | null,
    specialty: SPECIALTIES[0],
    count: 1,
  };
  specialistActions = signal<SpecialistAction[]>([]);

  ngOnInit() { this.applyDefaults(); }
  ngOnChanges(c: SimpleChanges) {
    if (c['defaultHospitalId']) this.applyDefaults();
  }

  private applyDefaults() {
    const id = this.defaultHospitalId;
    if (id == null) return;
    if (this.eq.fromHospitalId == null) { this.eq.fromHospitalId = id; this.onEqFromHospital(id); }
    if (this.staff.hospitalId == null) { this.staff.hospitalId = id; this.onStaffHospital(id); }
    if (this.spec.fromHospitalId == null) this.spec.fromHospitalId = id;
  }

  // ===== Equipment =====
  onEqFromHospital(id: number | null) {
    this.eq.fromServiceId = null;
    this.eq.equipmentId = null;
    this.eq.sourceEquipment = [];
    this.eq.fromServices = [];
    if (this.eqMode() === 'same-hospital') {
      this.eq.toHospitalId = id;
      this.eq.toServiceId = null;
      this.eq.toServices = [];
    }
    if (id != null) {
      this.api.listServices(id).subscribe({
        next: (s) => {
          this.eq.fromServices = s;
          if (this.eqMode() === 'same-hospital') this.eq.toServices = s;
        },
        error: () => {},
      });
    }
  }
  onEqToHospital(id: number | null) {
    this.eq.toServiceId = null;
    this.eq.toServices = [];
    if (id != null) {
      this.api.listServices(id).subscribe({ next: (s) => this.eq.toServices = s, error: () => {} });
    }
  }
  onEqFromService(id: number | null) {
    const svc = this.eq.fromServices.find(s => s.id === id);
    this.eq.sourceEquipment = svc?.equipment ?? [];
    this.eq.equipmentId = null;
  }
  effectiveEqToHospitalId(): number | null {
    return this.eqMode() === 'same-hospital' ? this.eq.fromHospitalId : this.eq.toHospitalId;
  }
  eqToServicesFiltered(): Service[] {
    return this.eq.toServices.filter(s => s.id !== this.eq.fromServiceId);
  }
  setEqMode(mode: 'same-hospital' | 'cross-hospital') {
    if (this.eqMode() === mode) return;
    this.eqMode.set(mode);
    // Reset target-side state when switching modes to avoid stale selections.
    this.eq.toHospitalId = mode === 'same-hospital' ? this.eq.fromHospitalId : null;
    this.eq.toServiceId = null;
    this.eq.toServices = mode === 'same-hospital' ? this.eq.fromServices : [];
  }

  submitEqTransfer() {
    const x = this.eq;
    if (x.fromHospitalId == null) {
      this.toasts.show({ title: 'Structure requise', description: 'Sélectionnez la structure source.', variant: 'destructive' });
      return;
    }
    if (this.eqMode() === 'cross-hospital') {
      if (x.toHospitalId == null) {
        this.toasts.show({ title: 'Structure cible requise', description: 'Sélectionnez la structure cible.', variant: 'destructive' });
        return;
      }
      if (x.fromHospitalId === x.toHospitalId) {
        this.toasts.show({ title: 'Cible invalide', description: 'La structure cible doit être différente de la source.', variant: 'destructive' });
        return;
      }
    }
    if (x.fromServiceId == null || x.toServiceId == null || x.equipmentId == null) {
      this.toasts.show({ title: 'Champs requis', description: 'Service source, service cible et équipement requis.', variant: 'destructive' });
      return;
    }
    if (x.fromServiceId === x.toServiceId) {
      this.toasts.show({ title: 'Cible invalide', description: 'Le service cible doit être différent du service source.', variant: 'destructive' });
      return;
    }
    const sel = x.sourceEquipment.find(e => e.id === x.equipmentId);
    const max = sel?.quantity ?? 1;
    if (x.quantity < 1 || x.quantity > max) {
      this.toasts.show({ title: 'Quantité invalide', description: `Entre 1 et ${max}.`, variant: 'destructive' });
      return;
    }
    this.eqSubmitting.set(true);
    this.api.transferEquipment(x.fromServiceId, { targetServiceId: x.toServiceId, equipmentId: x.equipmentId, quantity: x.quantity }).subscribe({
      next: () => {
        this.eqSubmitting.set(false);
        this.toasts.show({ title: 'Transfert effectué', description: `${x.quantity} × ${sel?.name ?? 'équipement'} transféré(s).`, variant: 'success' });
        this.onEqFromHospital(x.fromHospitalId);
        x.equipmentId = null; x.quantity = 1;
      },
      error: () => {
        this.eqSubmitting.set(false);
        this.toasts.show({ title: 'Erreur', description: 'Le transfert a échoué.', variant: 'destructive' });
      },
    });
  }

  // ===== Staff =====
  onStaffHospital(id: number | null) {
    this.staff.fromId = null;
    this.staff.toId = null;
    this.staff.services = [];
    if (id != null) {
      this.api.listServices(id).subscribe({ next: (s) => this.staff.services = s, error: () => {} });
    }
  }
  onStaffFromService(_id: number | null) { /* recompute via getter */ }
  staffToServicesFiltered(): Service[] {
    return this.staff.services.filter(s => s.id !== this.staff.fromId);
  }
  staffFromService(): Service | undefined {
    return this.staff.services.find(s => s.id === this.staff.fromId);
  }
  submitStaffTransfer() {
    const x = this.staff;
    const type = this.staffMode() as 'nurse' | 'doctor';
    if (x.fromId == null || x.toId == null) {
      this.toasts.show({ title: 'Champs requis', description: 'Service source et cible requis.', variant: 'destructive' });
      return;
    }
    if (x.fromId === x.toId) {
      this.toasts.show({ title: 'Cible invalide', description: 'Choisissez deux services différents.', variant: 'destructive' });
      return;
    }
    const fs = this.staffFromService();
    const max = fs ? (type === 'nurse' ? fs.nurses : fs.doctors) : 0;
    if (x.count < 1 || x.count > max) {
      this.toasts.show({ title: 'Effectif invalide', description: `Entre 1 et ${max}.`, variant: 'destructive' });
      return;
    }
    this.staffSubmitting.set(true);
    this.api.transferStaff(x.fromId, { targetServiceId: x.toId, staffType: type, count: x.count }).subscribe({
      next: () => {
        this.staffSubmitting.set(false);
        this.toasts.show({ title: 'Transfert effectué', description: `${x.count} ${type === 'nurse' ? 'infirmier(s)' : 'médecin(s)'} transféré(s).`, variant: 'success' });
        this.onStaffHospital(x.hospitalId);
        x.count = 1;
      },
      error: () => {
        this.staffSubmitting.set(false);
        this.toasts.show({ title: 'Erreur', description: 'Le transfert a échoué.', variant: 'destructive' });
      },
    });
  }

  // ===== Specialist (frontend-only) =====
  submitSpecialistTransfer() {
    const x = this.spec;
    if (x.fromHospitalId == null || x.toHospitalId == null) {
      this.toasts.show({ title: 'Champs requis', description: 'Structure source et cible requis.', variant: 'destructive' });
      return;
    }
    if (x.fromHospitalId === x.toHospitalId) {
      this.toasts.show({ title: 'Cible invalide', description: 'Choisissez deux structures différentes.', variant: 'destructive' });
      return;
    }
    if (x.count < 1) {
      this.toasts.show({ title: 'Effectif invalide', description: 'Au moins 1 médecin requis.', variant: 'destructive' });
      return;
    }
    const fromH = this.hospitals.find(h => h.id === x.fromHospitalId);
    const toH = this.hospitals.find(h => h.id === x.toHospitalId);
    if (!fromH || !toH) return;
    const action: SpecialistAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromHospitalId: x.fromHospitalId,
      fromHospitalName: fromH.name,
      toHospitalId: x.toHospitalId,
      toHospitalName: toH.name,
      specialty: x.specialty,
      count: x.count,
    };
    this.specialistActions.update(arr => [...arr, action]);
    this.toasts.show({ title: 'Transfert planifié', description: `${x.count} ${x.specialty.toLowerCase()} de ${fromH.name} → ${toH.name}.`, variant: 'success' });
    x.count = 1;
  }
  removeSpecialistAction(id: string) {
    this.specialistActions.update(arr => arr.filter(a => a.id !== id));
  }
}
