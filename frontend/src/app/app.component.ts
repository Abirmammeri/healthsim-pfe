import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/layout/sidebar.component';
import { ToastService } from './shared/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <app-sidebar></app-sidebar>
      <main class="flex-1 overflow-y-auto">
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
}
