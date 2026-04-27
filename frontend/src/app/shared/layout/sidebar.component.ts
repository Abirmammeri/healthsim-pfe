import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { SummaryStats } from '../models';

interface NavItem { path: string; label: string; icon: string; testid: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <aside class="w-64 flex-shrink-0 flex flex-col h-screen" style="background-color: #2C3136;">
      <!-- Logo -->
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center"
               style="background: linear-gradient(135deg, #00BCD4, #0097A7);">
            <lucide-icon name="activity" class="w-5 h-5 text-white"></lucide-icon>
          </div>
          <div>
            <div class="text-white font-bold text-lg leading-tight font-display">HealthSim</div>
            <div class="text-white/50 text-xs">Decision Support System</div>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div *ngIf="summary() as s" class="mx-4 mt-4 px-3 py-2.5 rounded-lg" style="background-color: rgba(255,255,255,0.06);">
        <div class="text-white/50 text-xs uppercase tracking-wider mb-2">Vue d'ensemble</div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <div class="text-white text-sm font-semibold">{{ s.totalHospitals }}</div>
            <div class="text-white/40 text-xs">Structures</div>
          </div>
          <div>
            <div class="text-white text-sm font-semibold">{{ s.totalPatients }}</div>
            <div class="text-white/40 text-xs">Patients</div>
          </div>
          <div>
            <div class="text-sm font-semibold" [class]="s.activeAlerts > 0 ? 'text-orange-400' : 'text-white'">{{ s.activeAlerts }}</div>
            <div class="text-white/40 text-xs">Alertes</div>
          </div>
          <div>
            <div class="text-sm font-semibold" data-testid="text-system-load"
                 [class]="s.overallLoadStatus === 'critical' ? 'text-red-400' : s.overallLoadStatus === 'high' ? 'text-orange-400' : 'text-green-400'">
              {{ s.criticalServices }}
              <span class="text-[11px] font-normal opacity-80 ml-1">({{ statusLabel(s.overallLoadStatus) }})</span>
            </div>
            <div class="text-white/40 text-xs">Services critiques</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div class="text-white/30 text-xs uppercase tracking-wider px-3 mb-2">Navigation</div>
        <a *ngFor="let n of navItems" [routerLink]="n.path"
           [attr.data-testid]="n.testid"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
           [ngClass]="isActive(n.path) ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
           [style.backgroundColor]="isActive(n.path) ? '#00BCD4' : ''">
          <lucide-icon [name]="n.icon" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">{{ n.label }}</span>
          <lucide-icon *ngIf="isActive(n.path)" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
        </a>

        <div class="text-white/30 text-xs uppercase tracking-wider px-3 mt-5 mb-2">Structures</div>
        <a routerLink="/" class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
           [ngClass]="hospitalsActive() ? 'text-white/90 bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'">
          <lucide-icon name="building-2" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">Toutes les structures</span>
        </a>
      </nav>

      <div class="px-6 py-4 border-t border-white/10">
        <div class="text-white/30 text-xs">HealthSim v1.0 — Algeria</div>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  summary = signal<SummaryStats | null>(null);
  currentUrl = signal<string>('/');

  navItems: NavItem[] = [
    { path: '/', label: 'Vue Carte', icon: 'map', testid: 'nav-vue-carte' },
    { path: '/alerts', label: 'Alertes', icon: 'bell', testid: 'nav-alertes' },
    { path: '/simulation', label: 'Centre de Simulation', icon: 'flask-conical', testid: 'nav-centre-de-simulation' },
  ];

  ngOnInit() {
    this.refreshSummary();
    this.currentUrl.set(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.refreshSummary();
      });
  }

  private refreshSummary() {
    this.api.getSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
  }

  isActive(path: string): boolean { return this.currentUrl() === path; }
  hospitalsActive(): boolean { return this.currentUrl().startsWith('/hospitals'); }

  statusLabel(s: string): string {
    return s === 'critical' ? 'CRITIQUE' : s === 'high' ? 'ÉLEVÉE' : 'NORMALE';
  }
}
