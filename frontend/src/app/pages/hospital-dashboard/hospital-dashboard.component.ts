import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../shared/api.service';
import { Alert, DashboardStats, Hospital, Service } from '../../shared/models';

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-8 py-6 bg-card border-b">
        <div class="flex items-center gap-2 mb-1">
          <button (click)="back()" class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors" data-testid="btn-back-to-map">
            <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
            Retour à la carte
          </button>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="text-2xl font-bold text-foreground font-display">{{ hospital()?.name }}</h1>
            <div class="text-sm text-muted-foreground mt-0.5">{{ hospital()?.address }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span *ngIf="hospital() as h" class="text-xs font-bold px-3 py-1.5 rounded-full uppercase"
                  [style.backgroundColor]="statusColor(h.loadStatus) + '15'" [style.color]="statusColor(h.loadStatus)">
              {{ statusLabel(h.loadStatus) }}
            </span>
            <a [routerLink]="['/hospitals', hospitalId, 'services']" class="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors flex items-center gap-2" data-testid="btn-view-services">
              <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
              Voir les services
            </a>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div *ngIf="loading()" class="flex items-center justify-center h-40">
          <div class="text-muted-foreground">Chargement…</div>
        </div>

        <div *ngIf="!loading() && dashboard() as d" class="space-y-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(0,188,212,0.1);">
                  <lucide-icon name="users" class="w-5 h-5" style="color: #00BCD4;"></lucide-icon>
                </div>
                <div>
                  <div class="text-2xl font-bold text-foreground">{{ d.doctors + d.nurses }}</div>
                  <div class="text-xs text-muted-foreground">Personnel</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground mt-3">{{ d.doctors }} médecins · {{ d.nurses }} infirmiers</div>
            </div>

            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
                  <lucide-icon name="bed" class="w-5 h-5 text-green-600"></lucide-icon>
                </div>
                <div>
                  <div class="text-2xl font-bold text-foreground">{{ d.availableBeds }}/{{ d.totalBeds }}</div>
                  <div class="text-xs text-muted-foreground">Lits disponibles</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground mt-3">{{ d.occupiedBeds }} occupés</div>
            </div>

            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
                  <lucide-icon name="trending-up" class="w-5 h-5 text-blue-600"></lucide-icon>
                </div>
                <div>
                  <div class="text-2xl font-bold text-foreground">{{ d.patients }}</div>
                  <div class="text-xs text-muted-foreground">Patients actifs</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground mt-3">Charge : {{ d.loadPercentage }}%</div>
            </div>

            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="d.activeAlerts > 0 ? 'bg-red-50' : 'bg-gray-50'">
                  <lucide-icon name="alert-triangle" class="w-5 h-5" [class]="d.activeAlerts > 0 ? 'text-red-600' : 'text-gray-400'"></lucide-icon>
                </div>
                <div>
                  <div class="text-2xl font-bold text-foreground">{{ d.activeAlerts }}</div>
                  <div class="text-xs text-muted-foreground">Alertes actives</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground mt-3">{{ d.serviceCount }} services</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-5">
              <h2 class="font-bold text-foreground flex items-center gap-2 mb-4">
                <lucide-icon name="stethoscope" class="w-4 h-4" style="color: #00BCD4;"></lucide-icon>
                Services
              </h2>
              <div *ngIf="services().length === 0" class="text-sm text-muted-foreground text-center py-6">Aucun service.</div>
              <div class="space-y-2">
                <div *ngFor="let s of services()" class="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" [style.backgroundColor]="statusColor(s.status)"></div>
                    <div>
                      <div class="font-semibold text-foreground text-sm">{{ s.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ s.doctors }} méd. · {{ s.nurses }} inf. · {{ s.patients }} patients</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-foreground">{{ s.availableBeds }}/{{ s.beds }}</div>
                    <div class="text-xs text-muted-foreground">lits</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h2 class="font-bold text-foreground flex items-center gap-2 mb-4">
                <lucide-icon name="package" class="w-4 h-4" style="color: #00BCD4;"></lucide-icon>
                État des équipements
              </h2>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    Opérationnels
                  </div>
                  <div class="font-bold text-foreground">{{ d.equipmentStatus.operational }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                    Maintenance
                  </div>
                  <div class="font-bold text-foreground">{{ d.equipmentStatus.maintenance }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                    Hors service
                  </div>
                  <div class="font-bold text-foreground">{{ d.equipmentStatus.offline }}</div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="alerts().length > 0" class="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h2 class="font-bold text-foreground flex items-center gap-2 mb-4">
              <lucide-icon name="alert-triangle" class="w-4 h-4 text-orange-500"></lucide-icon>
              Alertes récentes
            </h2>
            <div class="space-y-2">
              <div *ngFor="let a of alerts()" class="flex items-start gap-3 p-3 rounded-lg"
                   [style.backgroundColor]="(a.severity === 'critical' ? '#E53935' : '#FB8C00') + '10'">
                <lucide-icon name="alert-circle" class="w-4 h-4 mt-0.5 flex-shrink-0"
                              [style.color]="a.severity === 'critical' ? '#E53935' : '#FB8C00'"></lucide-icon>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-foreground">{{ a.serviceName }} — {{ a.type }}</div>
                  <div class="text-xs text-muted-foreground">{{ a.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HospitalDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  hospitalId = 0;
  hospital = signal<Hospital | null>(null);
  dashboard = signal<DashboardStats | null>(null);
  services = signal<Service[]>([]);
  alerts = signal<Alert[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.api.getHospital(this.hospitalId).subscribe({ next: h => this.hospital.set(h), error: () => {} });
    this.api.getHospitalDashboard(this.hospitalId).subscribe({
      next: d => { this.dashboard.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.listServices(this.hospitalId).subscribe({ next: s => this.services.set(s), error: () => {} });
    this.api.getHospitalAlerts(this.hospitalId).subscribe({ next: a => this.alerts.set(a), error: () => {} });
  }

  back() { this.router.navigate(['/']); }
  statusColor(s: string): string {
    if (s === 'critical') return '#E53935';
    if (s === 'high' || s === 'medium') return '#FB8C00';
    return '#43A047';
  }
  statusLabel(s: string): string {
    if (s === 'critical') return 'CRITIQUE';
    if (s === 'high') return 'CHARGE ÉLEVÉE';
    if (s === 'medium') return 'MOYENNE';
    return 'NORMALE';
  }
}
