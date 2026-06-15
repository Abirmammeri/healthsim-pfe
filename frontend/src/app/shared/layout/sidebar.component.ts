import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { SummaryStats } from '../models';

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
            <div class="text-white font-bold text-lg leading-tight">HealthSim</div>
            <div class="text-white/50 text-xs">Decision Support System</div>
          </div>
        </div>
      </div>

      <!-- Profil utilisateur -->
      <div class="mx-4 mt-4 px-3 py-2.5 rounded-lg" style="background-color: rgba(255,255,255,0.06);">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               [style.background]="auth.isDirecteur() ? 'linear-gradient(135deg,#00BCD4,#0288D1)' : 'linear-gradient(135deg,#43A047,#2E7D32)'">
            <lucide-icon [name]="auth.isDirecteur() ? 'brain' : 'stethoscope'" class="w-4 h-4 text-white"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-xs font-bold truncate">{{ auth.displayName() }}</div>
            <div class="text-xs font-semibold truncate"
                 [style.color]="auth.isDirecteur() ? '#00BCD4' : '#43A047'">
              {{ auth.isDirecteur() ? 'Directeur' : 'Chef de service' }}
            </div>
            <div *ngIf="auth.isChefService() && auth.currentUser()?.service"
                 class="text-white/40 text-[10px] truncate">
              {{ auth.currentUser()?.service?.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Vue d'ensemble (directeur seulement) -->
      <div *ngIf="auth.isDirecteur() && summary() as s"
           class="mx-4 mt-3 px-3 py-2.5 rounded-lg" style="background-color: rgba(255,255,255,0.04);">
        <div class="text-white/30 text-xs uppercase tracking-wider mb-2">Vue d'ensemble</div>
        <div class="grid grid-cols-2 gap-2">
          <div><div class="text-white text-sm font-semibold">{{ s.totalHospitals }}</div><div class="text-white/40 text-xs">Structures</div></div>
          <div><div class="text-white text-sm font-semibold">{{ s.totalPatients }}</div><div class="text-white/40 text-xs">Patients</div></div>
          <div><div class="text-sm font-semibold" [class]="s.activeAlerts > 0 ? 'text-orange-400' : 'text-white'">{{ s.activeAlerts }}</div><div class="text-white/40 text-xs">Alertes</div></div>
          <div><div class="text-sm font-semibold" [class]="s.criticalServices > 0 ? 'text-red-400' : 'text-green-400'">{{ s.criticalServices }}</div><div class="text-white/40 text-xs">Critiques</div></div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        <!-- DIRECTEUR -->
        <ng-container *ngIf="auth.isDirecteur()">
          <div class="text-white/30 text-xs uppercase tracking-wider px-3 mb-2">Navigation</div>
          <a routerLink="/"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="isActive('/') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="isActive('/') ? '#00BCD4' : ''">
            <lucide-icon name="layout-grid" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Vue Carte</span>
            <lucide-icon *ngIf="isActive('/')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
          </a>
          <a routerLink="/alerts"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="isActive('/alerts') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="isActive('/alerts') ? '#00BCD4' : ''">
            <lucide-icon name="alert-circle" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Alertes</span>
            <lucide-icon *ngIf="isActive('/alerts')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
          </a>

          <div class="text-white/30 text-xs uppercase tracking-wider px-3 mt-4 mb-2">Structures</div>
          <a routerLink="/"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-white/60 hover:text-white hover:bg-white/10">
            <lucide-icon name="users" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Toutes les structures</span>
          </a>

          <a routerLink="/doctors"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="isActive('/doctors') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="isActive('/doctors') ? '#00BCD4' : ''">
            <lucide-icon name="stethoscope" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Corps Médical</span>
            <lucide-icon *ngIf="isActive('/doctors')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
          </a>
        </ng-container>

        <!-- CHEF DE SERVICE -->
        <ng-container *ngIf="auth.isChefService()">
          <div class="text-white/30 text-xs uppercase tracking-wider px-3 mb-2">Mon Service</div>
          <a [routerLink]="['/hospitals', auth.userHospitalId(), 'services', auth.userServiceId()]"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="hospitalsActive() ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="hospitalsActive() ? '#00BCD4' : ''">
            <lucide-icon name="activity" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Tableau de bord</span>
          </a>
          <a (click)="goKpi('SSI')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-white/60 hover:text-white hover:bg-white/10">
            <lucide-icon name="users" class="w-4 h-4 flex-shrink-0" style="color:#00BCD4"></lucide-icon>
            <span class="text-sm font-medium">Flux Patients <span class="text-white/30 text-xs">SSI</span></span>
          </a>
          <a (click)="goKpi('IIP')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-white/60 hover:text-white hover:bg-white/10">
            <lucide-icon name="heart-pulse" class="w-4 h-4 flex-shrink-0" style="color:#E53935"></lucide-icon>
            <span class="text-sm font-medium">Qualité Clinique <span class="text-white/30 text-xs">IIP</span></span>
          </a>
          <a (click)="goKpi('ESI')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-white/60 hover:text-white hover:bg-white/10">
            <lucide-icon name="trending-up" class="w-4 h-4 flex-shrink-0" style="color:#43A047"></lucide-icon>
            <span class="text-sm font-medium">Finances <span class="text-white/30 text-xs">ESI</span></span>
          </a>
          <a (click)="goKpi('TI')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-white/60 hover:text-white hover:bg-white/10">
            <lucide-icon name="settings-2" class="w-4 h-4 flex-shrink-0" style="color:#FB8C00"></lucide-icon>
            <span class="text-sm font-medium">Infrastructure <span class="text-white/30 text-xs">TI</span></span>
          </a>

          <a routerLink="/doctors"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="isActive('/doctors') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="isActive('/doctors') ? '#43A047' : ''">
            <lucide-icon name="stethoscope" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Corps Médical</span>
            <lucide-icon *ngIf="isActive('/doctors')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
          </a>

          <!-- Paramètres du service — chef de service uniquement -->
          <a routerLink="/service-params"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
             [ngClass]="isActive('/service-params') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
             [style.backgroundColor]="isActive('/service-params') ? '#43A047' : ''">
            <lucide-icon name="sliders-horizontal" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            <span class="text-sm font-medium">Paramètres du service</span>
            <lucide-icon *ngIf="isActive('/service-params')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
          </a>
        </ng-container>

        <!-- MESSAGERIE -->
        <div class="text-white/30 text-xs uppercase tracking-wider px-3 mt-4 mb-2">Messagerie</div>
        <a routerLink="/messaging"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
           [ngClass]="isActive('/messaging') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
           [style.backgroundColor]="isActive('/messaging') ? '#00BCD4' : ''">
          <lucide-icon name="users" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">Messagerie</span>
          <span *ngIf="unreadCount() > 0" class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style="background:#E53935">{{ unreadCount() }}</span>
        </a>

        <!-- SIMULATION -->
        <div class="text-white/30 text-xs uppercase tracking-wider px-3 mt-4 mb-2">Simulation</div>
        <a routerLink="/simulation"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
           [ngClass]="isActive('/simulation') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
           [style.backgroundColor]="isActive('/simulation') ? '#00BCD4' : ''">
          <lucide-icon name="brain" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">Centre de Simulation</span>
          <lucide-icon *ngIf="isActive('/simulation')" name="chevron-right" class="w-3 h-3 ml-auto"></lucide-icon>
        </a>

      </nav>

      <!-- Mon compte -->
      <div class="px-3 pb-2">
        <div class="text-white/30 text-xs uppercase tracking-wider px-3 mb-2">Mon compte</div>
        <a routerLink="/profile"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
           [ngClass]="isActive('/profile') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'"
           [style.backgroundColor]="isActive('/profile') ? '#00BCD4' : ''">
          <lucide-icon name="users" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">Mon profil</span>
        </a>
      </div>

      <!-- Déconnexion -->
      <div class="px-4 py-4 border-t border-white/10">
        <button (click)="logout()"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/10 transition-all">
          <lucide-icon name="arrow-left" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="text-sm font-medium">Se déconnecter</span>
        </button>
        <div class="text-white/20 text-xs text-center mt-2">HealthSim v1.0 — Algeria</div>
      </div>

    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);
  auth: AuthService = inject(AuthService);
  summary      = signal<SummaryStats | null>(null);
  currentUrl   = signal<string>('/');
  unreadCount  = signal<number>(0);
  private http = inject(HttpClient);

  ngOnInit() {
    this.refreshSummary();
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.refreshSummary();
        this.refreshUnread();
      });
    this.refreshUnread();
    setInterval(() => this.refreshUnread(), 15000);
  }

  private refreshSummary() {
    if (this.auth.isDirecteur()) {
      this.api.getSummary().subscribe({ next: s => this.summary.set(s), error: () => {} });
    }
  }

  goKpi(cat: string) {
    const hId = this.auth.userHospitalId();
    const sId = this.auth.userServiceId();
    if (!hId || !sId) return;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/hospitals', hId, 'services', sId, 'kpi', cat]);
    });
  }

  private refreshUnread() {
    this.http.get<{count:number}>('http://localhost:8000/api/messaging/unread')
      .subscribe({ next: r => this.unreadCount.set(r.count), error: () => {} });
  }

  logout() { this.auth.logout(); }
  isActive(path: string): boolean { return this.currentUrl() === path; }
  hospitalsActive(): boolean { return this.currentUrl().startsWith('/hospitals'); }
}