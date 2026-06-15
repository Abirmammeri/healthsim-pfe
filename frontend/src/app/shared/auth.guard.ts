// src/app/shared/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

async function ensureUser(auth: AuthService): Promise<boolean> {
  // Si user déjà chargé ET token présent → ok immédiatement
  if (auth.currentUser() && auth.token()) return true;

  // Si token présent mais user pas encore chargé → charger
  const token = localStorage.getItem('hs_token');
  if (token) {
    // Si token signal déjà set et user en cours de chargement, attendre
    if (auth.token() && !auth.currentUser()) {
      await auth.init();
      return !!auth.currentUser();
    }
    // Sinon init complet
    if (!auth.token()) {
      auth.token.set(token);
    }
    await auth.init();
    return !!auth.currentUser();
  }

  return false;
}

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const ok = await ensureUser(auth);
  if (ok) return true;
  router.navigate(['/login']);
  return false;
};

export const directeurGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const ok = await ensureUser(auth);
  if (!ok) { router.navigate(['/login']); return false; }
  if (auth.isDirecteur()) return true;
  const u = auth.currentUser();
  if (u?.hospital_id && u?.service_id) {
    router.navigate(['/hospitals', u.hospital_id, 'services', u.service_id]);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const serviceGuard: CanActivateFn = async (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const ok = await ensureUser(auth);
  if (!ok) { router.navigate(['/login']); return false; }
  const serviceId = parseInt(route.paramMap.get('svcId') ?? '0', 10);
  if (auth.canAccessService(serviceId)) return true;
  const u = auth.currentUser();
  if (u?.hospital_id && u?.service_id) {
    router.navigate(['/hospitals', u.hospital_id, 'services', u.service_id]);
  }
  return false;
};