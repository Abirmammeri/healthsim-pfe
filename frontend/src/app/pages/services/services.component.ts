import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../shared/api.service';
import { Hospital, Service } from '../../shared/models';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-8 py-6 bg-card border-b">
        <div class="flex items-center gap-4 mb-1">
          <button (click)="back()" class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors" data-testid="btn-back-to-dashboard">
            <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
            Tableau de bord
          </button>
          <span class="text-muted-foreground">/</span>
          <span class="text-sm text-foreground font-medium">{{ hospital()?.name }}</span>
          <span class="text-muted-foreground">/</span>
          <span class="text-sm text-foreground font-medium">Services</span>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="text-2xl font-bold text-foreground font-display">Services — Vue d'ensemble</h1>
            <div class="text-xs text-muted-foreground mt-1">
              Cette page est en lecture seule. L'ajout de service et toutes les modifications (équipement, transferts) se font dans le Centre de Simulation.
            </div>
          </div>
          <button (click)="goSim()" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style="background: linear-gradient(135deg, #00BCD4, #0288D1);" data-testid="btn-go-to-simulation">
            <lucide-icon name="brain" class="w-4 h-4"></lucide-icon>
            Centre de Simulation
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div *ngIf="loading()" class="flex items-center justify-center h-40">
          <div class="text-muted-foreground">Chargement des services...</div>
        </div>

        <div *ngIf="!loading() && services().length === 0" class="flex flex-col items-center justify-center h-40 text-center">
          <div class="text-muted-foreground mb-2">Aucun service enregistré</div>
        </div>

        <div *ngIf="!loading() && services().length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div *ngFor="let svc of services()" [attr.data-testid]="'service-card-' + svc.id"
               class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" [style.backgroundColor]="statusColor(svc.status)"></div>
                  <div>
                    <div class="font-semibold text-foreground">{{ svc.name }}</div>
                    <div class="text-xs text-muted-foreground">Chef : Dr. {{ svc.head }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                        [style.backgroundColor]="statusColor(svc.status) + '15'" [style.color]="statusColor(svc.status)">
                    {{ statusLabel(svc.status) }}
                  </span>
                  <button (click)="toggle(svc.id)" class="p-1 hover:bg-muted rounded"
                          [attr.data-testid]="'btn-expand-service-' + svc.id" aria-label="Développer">
                    <lucide-icon [name]="expanded[svc.id] ? 'chevron-down' : 'chevron-right'" class="w-4 h-4 text-muted-foreground"></lucide-icon>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-5 gap-3 mb-3">
                <div class="bg-muted/50 rounded-xl p-2.5 text-center">
                  <div class="text-sm font-bold text-foreground">{{ svc.doctors }}</div>
                  <div class="text-xs text-muted-foreground">Médecins</div>
                </div>
                <div class="bg-muted/50 rounded-xl p-2.5 text-center">
                  <div class="text-sm font-bold text-foreground">{{ svc.nurses }}</div>
                  <div class="text-xs text-muted-foreground">Infirmiers</div>
                </div>
                <div class="bg-muted/50 rounded-xl p-2.5 text-center">
                  <div class="text-sm font-bold text-foreground">{{ svc.availableBeds }}/{{ svc.beds }}</div>
                  <div class="text-xs text-muted-foreground">Lits</div>
                </div>
                <div class="bg-muted/50 rounded-xl p-2.5 text-center">
                  <div class="text-sm font-bold text-foreground">{{ svc.patients }}</div>
                  <div class="text-xs text-muted-foreground">Patients</div>
                </div>
                <div class="bg-muted/50 rounded-xl p-2.5 text-center">
                  <div class="text-sm font-bold text-foreground">{{ totalEquip(svc) }}</div>
                  <div class="text-xs text-muted-foreground">Équipements</div>
                </div>
              </div>

              <div>
                <div class="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [style.width.%]="loadPct(svc)" [style.backgroundColor]="statusColor(svc.status)"></div>
                </div>
                <div class="text-xs text-muted-foreground mt-1">Occupation des lits : {{ loadPct(svc) }}%</div>
              </div>
            </div>

            <div *ngIf="expanded[svc.id]" class="border-t border-border p-5">
              <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Équipements</div>
              <div *ngIf="(svc.equipment || []).length === 0" class="text-center text-sm text-muted-foreground py-3">
                Aucun équipement enregistré
              </div>
              <div *ngIf="(svc.equipment || []).length > 0" class="space-y-2">
                <div *ngFor="let eq of svc.equipment" [attr.data-testid]="'equipment-row-' + eq.id"
                     class="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" [style.backgroundColor]="eqColor(eq.status)"></div>
                    <div>
                      <div class="text-sm font-medium text-foreground">{{ eq.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ eq.type }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-foreground">×{{ eq.quantity }}</div>
                    <div class="text-xs" [style.color]="eqColor(eq.status)">{{ eqLabel(eq.status) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ServicesComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  hospitalId = 0;
  hospital = signal<Hospital | null>(null);
  services = signal<Service[]>([]);
  loading = signal(true);
  expanded: Record<number, boolean> = {};

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.api.getHospital(this.hospitalId).subscribe({ next: h => this.hospital.set(h), error: () => {} });
    this.api.listServices(this.hospitalId).subscribe({
      next: (s) => { this.services.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  back() { this.router.navigate(['/hospitals', this.hospitalId]); }
  goSim() { this.router.navigate(['/simulation']); }
  toggle(id: number) { this.expanded[id] = !this.expanded[id]; }

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
  totalEquip(svc: Service): number {
    return (svc.equipment || []).reduce((q, e) => q + (e.quantity ?? 0), 0);
  }
  loadPct(svc: Service): number {
    return svc.beds > 0 ? Math.round((svc.patients / svc.beds) * 100) : 0;
  }
  eqColor(s: string): string {
    return s === 'operational' ? '#43A047' : s === 'maintenance' ? '#FB8C00' : '#E53935';
  }
  eqLabel(s: string): string {
    return s === 'operational' ? 'opérationnel' : s === 'maintenance' ? 'maintenance' : 'hors service';
  }
}
