import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../shared/api.service';
import { Hospital, Service } from '../../shared/models';

const PRIMARY = '#00BCD4'; const PRIMARY_DARK = '#0288D1';
const GREEN = '#43A047'; const ORANGE = '#FB8C00'; const RED = '#E53935';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="flex flex-col h-full bg-background">

  <!-- HEADER -->
  <div class="px-6 py-4 bg-card border-b flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <a [routerLink]="['/hospitals', hospitalId]" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
        <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
      </a>
      <div>
        <h1 class="text-lg font-bold text-foreground">{{ hospital()?.name }} — Services</h1>
        <p class="text-xs text-muted-foreground">Cliquer sur un service pour voir ses KPIs détaillés</p>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <span *ngIf="countByStatus('critical')>0" class="text-[10px] font-bold px-2 py-1 rounded-full" style="background:#E5393518;color:#E53935">
        {{ countByStatus('critical') }} critique{{ countByStatus('critical')>1?'s':'' }}
      </span>
      <span *ngIf="countByStatus('medium')+countByStatus('high')>0" class="text-[10px] font-bold px-2 py-1 rounded-full" style="background:#FB8C0018;color:#FB8C00">
        {{ countByStatus('medium')+countByStatus('high') }} attention
      </span>
      <span *ngIf="countByStatus('normal')>0" class="text-[10px] font-bold px-2 py-1 rounded-full" style="background:#43A04718;color:#43A047">
        {{ countByStatus('normal') }} normal{{ countByStatus('normal')>1?'s':'' }}
      </span>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-5">
  <div *ngIf="loading()" class="flex items-center justify-center h-40 text-sm text-muted-foreground">Chargement…</div>

  <div *ngIf="!loading()" class="max-w-5xl mx-auto space-y-5">

    <!-- TITRE SECTION -->
    <div class="flex items-center gap-2 px-1">
      <span class="w-1.5 h-4 rounded-full" [style.backgroundColor]="PRIMARY"></span>
      <span class="text-xs font-bold text-foreground uppercase tracking-wider">Services de l'établissement</span>
      <span class="text-xs text-muted-foreground ml-1">— {{ services().length }} service{{ services().length>1?'s':'' }}</span>
    </div>

    <!-- GRILLE DES SERVICES -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div *ngFor="let svc of services()"
           (click)="goService(svc.id)"
           class="bg-card rounded-2xl border shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
           [style.borderColor]="statusColor(svc.status)+'50'">

        <!-- Bande couleur statut en haut -->
        <div class="h-1.5 w-full" [style.backgroundColor]="statusColor(svc.status)"></div>

        <div class="p-5">
          <!-- Ligne 1 : Nom + Badge statut -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-base font-bold text-foreground">{{ svc.name }}</h3>
              <div class="flex items-center gap-1.5 mt-0.5">
                <lucide-icon name="user" class="w-3 h-3 text-muted-foreground"></lucide-icon>
                <span class="text-xs text-muted-foreground">Dr. {{ svc.head }}</span>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                  [style.backgroundColor]="statusColor(svc.status)+'18'"
                  [style.color]="statusColor(svc.status)">
              {{ statusLabel(svc.status) }}
            </span>
          </div>

          <!-- Ligne 2 : 4 métriques clés -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="bg-muted/40 rounded-xl p-2.5 text-center">
              <lucide-icon name="stethoscope" class="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1"></lucide-icon>
              <div class="text-base font-bold text-foreground">{{ svc.doctors }}</div>
              <div class="text-[9px] text-muted-foreground">Médecins</div>
            </div>
            <div class="bg-muted/40 rounded-xl p-2.5 text-center">
              <lucide-icon name="users" class="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1"></lucide-icon>
              <div class="text-base font-bold text-foreground">{{ svc.nurses }}</div>
              <div class="text-[9px] text-muted-foreground">Infirmiers</div>
            </div>
            <div class="bg-muted/40 rounded-xl p-2.5 text-center">
              <lucide-icon name="heart-pulse" class="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1"></lucide-icon>
              <div class="text-base font-bold text-foreground">{{ svc.patients }}</div>
              <div class="text-[9px] text-muted-foreground">Patients</div>
            </div>
            <!-- CORRECTION : lits libres = beds - patients -->
            <div class="bg-muted/40 rounded-xl p-2.5 text-center">
              <lucide-icon name="bed" class="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1"></lucide-icon>
              <div class="text-base font-bold"
                   [style.color]="((svc.beds - svc.patients) <= 2) ? RED : GREEN">
                {{ (svc.beds - svc.patients) > 0 ? (svc.beds - svc.patients) : 0 }}
              </div>
              <div class="text-[9px] text-muted-foreground">Lits lib.</div>
            </div>
          </div>

          <!-- Ligne 3 : Barre occupation -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] text-muted-foreground">Occupation des lits</span>
              <span class="text-[10px] font-bold" [style.color]="statusColor(svc.status)">{{ loadPct(svc) }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all" [style.backgroundColor]="statusColor(svc.status)" [style.width.%]="loadPct(svc)"></div>
            </div>
            <div class="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>{{ svc.patients }} / {{ svc.beds }} lits</span>
              <span class="font-semibold" [style.color]="statusColor(svc.status)">{{ loadPct(svc)>=85?'Saturation':loadPct(svc)>=70?'Attention':'Normal' }}</span>
            </div>
          </div>

          <!-- Ligne 4 : Voir détails -->
          <div class="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
            <span class="text-[11px] text-muted-foreground">{{ svc.equipment?.length ?? 0 }} équipements enregistrés</span>
            <span class="flex items-center gap-1 text-xs font-semibold" [style.color]="PRIMARY">
              Voir KPIs détaillés <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOUTON SIMULATION HÔPITAL -->
    <div class="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4 mt-2">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <lucide-icon name="check-circle" class="w-4 h-4" [style.color]="PRIMARY"></lucide-icon>
          <span class="text-sm font-bold text-foreground">Centre de Simulation — Hôpital complet</span>
        </div>
        <div class="text-xs text-muted-foreground">Réservé au directeur d'hôpital · Simulation sur tous les services</div>
      </div>
      <button (click)="goSimHospital()" class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md flex-shrink-0" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="brain" class="w-4 h-4"></lucide-icon>Simuler l'hôpital
      </button>
    </div>

  </div>
  </div>
</div>
  `,
})
export class ServicesComponent implements OnInit {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  hospitalId = 0;
  hospital   = signal<Hospital | null>(null);
  services   = signal<Service[]>([]);
  loading    = signal(true);

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    forkJoin({
      hospital: this.api.getHospital(this.hospitalId),
      services: this.api.listServices(this.hospitalId),
    }).subscribe({
      next: ({ hospital, services }) => {
        this.hospital.set(hospital);
        this.services.set(services);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goService(svcId: number) { this.router.navigate(['/hospitals', this.hospitalId, 'services', svcId]); }
  goSimHospital() { this.router.navigate(['/simulation']); }

  readonly PRIMARY = PRIMARY; readonly RED = RED; readonly GREEN = GREEN;
  countByStatus(s: string): number { return this.services().filter(x => x.status === s).length; }
  loadPct(svc: Service): number { return svc.beds > 0 ? Math.round((svc.patients / svc.beds) * 100) : 0; }
  statusColor(s: string): string { return s==='critical'?RED:s==='medium'||s==='high'?ORANGE:GREEN; }
  statusLabel(s: string): string { return s==='critical'?'Critique':s==='medium'||s==='high'?'Attention':'Normal'; }
}