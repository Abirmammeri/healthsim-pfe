import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly items = signal<ToastItem[]>([]);

  show(t: Omit<ToastItem, 'id'>) {
    const id = this.nextId++;
    this.items.update(arr => [...arr, { id, ...t }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
  dismiss(id: number) {
    this.items.update(arr => arr.filter(x => x.id !== id));
  }
}
