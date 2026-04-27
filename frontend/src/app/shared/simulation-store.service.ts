import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SimulationStoreService {
  last: any = null;
  set(data: any) { this.last = data; }
  get() { return this.last; }
}
