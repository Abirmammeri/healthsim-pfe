import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import * as L from 'leaflet';
import { ApiService } from '../../shared/api.service';
import { Hospital, SummaryStats } from '../../shared/models';

const HOSPITAL_COORDS: Record<string, [number, number]> = {
  'CHU Benbadis Constantine': [36.3650, 6.6147],
  'Polyclinique El Khroub': [36.2667, 6.6833],
  'Polyclinique Boumerzoug': [36.3406, 6.5581],
  'Polyclinique Pierre Chaulet': [36.3500, 6.6000],
};

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-8 py-6 border-b bg-card">
        <h1 class="text-2xl font-bold text-foreground font-display">Carte des structures sanitaires</h1>
        <p class="text-muted-foreground text-sm mt-0.5">Région de Constantine, Algérie — Cliquez sur une structure pour ouvrir son tableau de bord</p>
      </div>

      <div *ngIf="summary() as s" class="px-8 py-4 bg-card border-b grid grid-cols-4 gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: rgba(0,188,212,0.1);">
            <lucide-icon name="users" class="w-4 h-4" style="color: #00BCD4;"></lucide-icon>
          </div>
          <div>
            <div class="text-lg font-bold text-foreground">{{ s.totalDoctors + s.totalNurses }}</div>
            <div class="text-xs text-muted-foreground">Personnel total</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50">
            <lucide-icon name="bed-double" class="w-4 h-4 text-green-600"></lucide-icon>
          </div>
          <div>
            <div class="text-lg font-bold text-foreground">{{ s.availableBeds }}/{{ s.totalBeds }}</div>
            <div class="text-xs text-muted-foreground">Lits disponibles</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
            <lucide-icon name="trending-up" class="w-4 h-4 text-blue-600"></lucide-icon>
          </div>
          <div>
            <div class="text-lg font-bold text-foreground">{{ s.totalPatients }}</div>
            <div class="text-xs text-muted-foreground">Patients actifs</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="s.activeAlerts > 0 ? 'bg-red-50' : 'bg-gray-50'">
            <lucide-icon name="alert-triangle" class="w-4 h-4" [class]="s.activeAlerts > 0 ? 'text-red-600' : 'text-gray-400'"></lucide-icon>
          </div>
          <div>
            <div class="text-lg font-bold text-foreground">{{ s.activeAlerts }}</div>
            <div class="text-xs text-muted-foreground">Alertes actives</div>
          </div>
        </div>
      </div>

      <div class="flex-1 relative">
        <div *ngIf="loading()" class="flex items-center justify-center h-full">
          <div class="text-muted-foreground">Loading hospitals...</div>
        </div>
        <div #mapEl class="absolute inset-0" data-testid="map-container" [style.display]="loading() ? 'none' : 'block'"></div>
      </div>

      <div *ngIf="hospitals().length > 0" class="px-8 py-4 bg-card border-t">
        <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Structures du réseau</div>
        <div class="grid grid-cols-4 gap-3">
          <button *ngFor="let h of hospitals()"
                  [attr.data-testid]="'card-hospital-' + h.id"
                  (click)="open(h.id)"
                  class="text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all bg-card">
            <div class="flex items-center justify-between mb-2">
              <div class="w-2 h-2 rounded-full" [style.background-color]="statusColor(h.loadStatus)"></div>
              <span class="text-xs font-semibold" [style.color]="statusColor(h.loadStatus)">{{ statusLabel(h.loadStatus) }}</span>
            </div>
            <div class="text-sm font-semibold text-foreground leading-tight mb-1">{{ h.name }}</div>
            <div class="text-xs text-muted-foreground">{{ h.patients }} patients · {{ loadPct(h) }}% charge</div>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  hospitals = signal<Hospital[]>([]);
  summary = signal<SummaryStats | null>(null);
  loading = signal(true);
  private map?: L.Map;
  private viewReady = false;

  ngOnInit() {
    this.api.listHospitals().subscribe({
      next: (h) => { this.hospitals.set(h); this.loading.set(false); this.tryRender(); },
      error: () => { this.loading.set(false); },
    });
    this.api.getSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
  }

  ngAfterViewInit() { this.viewReady = true; this.tryRender(); }

  ngOnDestroy() { this.map?.remove(); }

  private tryRender() {
    if (!this.viewReady || this.loading()) return;
    if (this.map) return;
    this.map = L.map(this.mapEl.nativeElement, { center: [36.34, 6.62], zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 0);

    for (const h of this.hospitals()) {
      const coords = HOSPITAL_COORDS[h.name] ?? [36.34, 6.62];
      const color = this.statusColor(h.loadStatus);
      const marker = L.circleMarker(coords as L.LatLngTuple, {
        radius: 18, fillColor: color, fillOpacity: 0.85, color: 'white', weight: 3,
      }).addTo(this.map);
      const popup = `
        <div style="padding:4px;min-width:180px;font-family:Inter,sans-serif">
          <div style="font-weight:600;color:#111827;font-size:14px;margin-bottom:8px">${h.name}</div>
          <div style="font-size:12px;color:#4b5563;display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>Patients :</span><span style="font-weight:500">${h.patients}</span></div>
            <div style="display:flex;justify-content:space-between"><span>Lits disponibles :</span><span style="font-weight:500">${h.availableBeds}/${h.totalBeds}</span></div>
            <div style="display:flex;justify-content:space-between"><span>Statut :</span><span style="font-weight:600;color:${color}">${this.statusLabel(h.loadStatus)}</span></div>
          </div>
          <button data-popup-open="${h.id}" style="margin-top:12px;width:100%;padding:6px;font-size:12px;font-weight:600;color:white;background:#00BCD4;border:none;border-radius:4px;cursor:pointer">Ouvrir le tableau de bord</button>
        </div>
      `;
      marker.bindTooltip(h.name, { direction: 'top', offset: [0, -8] });
      marker.bindPopup(popup);
      // Direct navigation on marker click — open the dashboard of that structure.
      marker.on('click', () => this.open(h.id));
      marker.on('popupopen', () => {
        const btn = document.querySelector(`[data-popup-open="${h.id}"]`) as HTMLButtonElement | null;
        btn?.addEventListener('click', () => this.open(h.id));
      });
      // Accessibility: pointer cursor on marker
      const el = (marker as any)._path as SVGElement | undefined;
      if (el) { el.style.cursor = 'pointer'; el.setAttribute('data-testid', `map-marker-${h.id}`); }
    }
  }

  open(id: number) { this.router.navigate(['/hospitals', id]); }

  statusColor(s: string): string {
    if (s === 'critical') return '#E53935';
    if (s === 'high') return '#FB8C00';
    return '#43A047';
  }
  statusLabel(s: string): string {
    if (s === 'critical') return 'Critique';
    if (s === 'high') return 'Charge élevée';
    return 'Normale';
  }
  loadPct(h: Hospital): number {
    return h.capacity > 0 ? Math.round((h.patients / h.capacity) * 100) : 0;
  }
}
