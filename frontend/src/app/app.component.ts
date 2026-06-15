import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './shared/layout/sidebar.component';
import { ToastService } from './shared/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <app-sidebar *ngIf="!isLoginPage()"></app-sidebar>
      <main class="flex-1 overflow-y-auto h-full min-h-0">
        <router-outlet></router-outlet>
      </main>
    </div>

    <div class="toast-host">
      <div *ngFor="let t of toasts.items()"
           class="toast"
           [class.error]="t.variant === 'destructive'"
           [class.success]="t.variant === 'success'"
           (click)="toasts.dismiss(t.id)">
        <div class="t-title">{{ t.title }}</div>
        <div class="t-desc" *ngIf="t.description">{{ t.description }}</div>
      </div>
    </div>
  `,
})
export class AppComponent {
  toasts = inject(ToastService);
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isLoginPage = computed(() => this.currentUrl().startsWith('/login'));
}