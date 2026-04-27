import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../shared/api.service';
import { Alert } from '../../shared/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-8 py-6 bg-card border-b">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-foreground font-display">Tableau d'alertes</h1>
            <p class="text-muted-foreground text-sm mt-0.5">Alertes actives à l'échelle du système</p>
          </div>
          <div *ngIf="alerts() as all" class="flex gap-3">
            <div class="px-4 py-2 rounded-xl bg-red-50 border border-red-200">
              <div class="text-xl font-bold text-red-600">{{ critical().length }}</div>
              <div class="text-xs text-red-500">Critiques</div>
            </div>
            <div class="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200">
              <div class="text-xl font-bold text-orange-600">{{ warning().length }}</div>
              <div class="text-xs text-orange-500">Avertissements</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div *ngIf="loading()" class="flex items-center justify-center h-40">
          <div class="text-muted-foreground">Chargement des alertes…</div>
        </div>
        <ng-container *ngIf="!loading()">
          <div *ngIf="alerts().length === 0" class="flex flex-col items-center justify-center h-60 text-center">
            <div class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <lucide-icon name="activity" class="w-7 h-7 text-green-500"></lucide-icon>
            </div>
            <div class="font-semibold text-foreground mb-1">Aucune alerte active</div>
            <div class="text-sm text-muted-foreground">Tous les services hospitaliers fonctionnent normalement</div>
          </div>

          <div *ngIf="alerts().length > 0" class="space-y-6">
            <div *ngIf="critical().length > 0">
              <div class="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">Alertes critiques</div>
              <div class="space-y-3">
                <div *ngFor="let a of critical()" [attr.data-testid]="'alert-card-' + a.id"
                     class="rounded-2xl p-5 border"
                     style="background-color:#FFF5F5;border-color:#FECACA">
                  <ng-container *ngTemplateOutlet="alertBody; context:{ a:a, color:'#E53935' }"></ng-container>
                </div>
              </div>
            </div>

            <div *ngIf="warning().length > 0">
              <div class="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">Avertissements</div>
              <div class="space-y-3">
                <div *ngFor="let a of warning()" [attr.data-testid]="'alert-card-' + a.id"
                     class="rounded-2xl p-5 border"
                     style="background-color:#FFFBF0;border-color:#FED7AA">
                  <ng-container *ngTemplateOutlet="alertBody; context:{ a:a, color:'#FB8C00' }"></ng-container>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>

    <ng-template #alertBody let-a="a" let-color="color">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" [style.backgroundColor]="color + '15'">
          <lucide-icon name="alert-triangle" class="w-5 h-5" [style.color]="color"></lucide-icon>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-white px-2 py-0.5 rounded-full uppercase" [style.backgroundColor]="color">{{ a.type }}</span>
            <span class="text-xs font-semibold uppercase" [style.color]="color">{{ a.severity }}</span>
          </div>
          <div class="font-semibold text-foreground mb-0.5">{{ a.hospitalName }} — {{ a.serviceName }}</div>
          <div class="text-sm text-muted-foreground">{{ a.description }}</div>
          <div class="text-xs text-muted-foreground mt-2">{{ a.createdAt | date:'medium':undefined:'fr' }}</div>
        </div>
      </div>
    </ng-template>
  `,
})
export class AlertsComponent implements OnInit {
  private api = inject(ApiService);
  alerts = signal<Alert[]>([]);
  loading = signal(true);
  critical = computed(() => this.alerts().filter(a => a.severity === 'critical'));
 warning = computed(() => this.alerts().filter(a => a.severity === 'warning' || a.severity === 'high' || a.severity === 'medium'));

  ngOnInit() {
    this.api.listAlerts().subscribe({
      next: (a) => { this.alerts.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
