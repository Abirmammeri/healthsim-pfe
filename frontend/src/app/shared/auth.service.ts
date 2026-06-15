// src/app/shared/auth.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

const BASE = 'http://localhost:8000/api';

export interface AuthUser {
  id: number;
  name: string;
  nom?: string;
  prenom?: string;
  email: string;
  role: 'directeur' | 'chef_service';
  hospital_id?: number;
  service_id?: number;
  has_face?: boolean;
  phone?: string;
  status?: string;
  hospital?: { id: number; name: string };
  service?: { id: number; name: string; head: string };
  is_active: boolean;
  replacement_service_id?: number; // Service dont il est remplaçant
  replacement_until?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // ── Signals ──────────────────────────────────────────
  currentUser = signal<AuthUser | null>(null);
  token       = signal<string | null>(localStorage.getItem('hs_token'));
  isLoading   = signal(false);
  error       = signal<string | null>(null);

  // ── Computed ─────────────────────────────────────────
  isLoggedIn     = computed(() => !!this.token() && !!this.currentUser());
  isDirecteur    = computed(() => this.currentUser()?.role === 'directeur');
  isChefService  = computed(() => this.currentUser()?.role === 'chef_service');
  isReplacement  = computed(() => !!this.currentUser()?.replacement_service_id);
  effectiveServiceId = computed(() =>
    this.currentUser()?.replacement_service_id ?? this.currentUser()?.service_id ?? null
  );
  userServiceId  = computed(() => this.currentUser()?.service_id ?? null);
  userHospitalId = computed(() => this.currentUser()?.hospital_id ?? null);
  displayName    = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    return u.prenom && u.nom ? `Dr. ${u.prenom} ${u.nom}` : u.name;
  });

  // ── Init ─────────────────────────────────────────────
  init(): Promise<void> {
    const token = localStorage.getItem('hs_token');
    if (!token) {
      this.token.set(null);
      this.currentUser.set(null);
      return Promise.resolve();
    }
    this.token.set(token);
    return new Promise(resolve => {
      this.http.get<AuthUser>(`${BASE}/auth/me`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        })
      }).subscribe({
        next: u => {
          this.currentUser.set(u);
          this.token.set(token);
          resolve();
        },
        error: () => {
          localStorage.removeItem('hs_token');
          this.token.set(null);
          this.currentUser.set(null);
          resolve();
        }
      });
    });
  }

  // ── Login ─────────────────────────────────────────────
  login(email: string, password: string) {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.post<{ token: string; user: AuthUser }>(
      `${BASE}/auth/login`, { email, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('hs_token', res.token);
        this.token.set(res.token);
        this.currentUser.set(res.user);
        this.isLoading.set(false);
        // Redirection selon rôle
        if (res.user.role === 'directeur') {
          this.router.navigate(['/']);
        } else {
          // Chef de service → son service directement
          const hId = res.user.hospital_id;
          const sId = res.user.service_id;
          if (hId && sId) {
            this.router.navigate(['/hospitals', hId, 'services', sId]);
          } else {
            this.router.navigate(['/']);
          }
        }
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Connexion impossible. Vérifiez vos identifiants.';
        this.error.set(msg);
        return throwError(() => err);
      })
    );
  }

  // ── Logout ─────────────────────────────────────────────
  logout() {
    const token = this.token();
    if (token) {
      this.http.post(`${BASE}/auth/logout`, {}, { headers: this.headers() })
        .subscribe({ error: () => {} });
    }
    localStorage.removeItem('hs_token');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // ── Helpers ────────────────────────────────────────────
  headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token()}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    });
  }

  // Vérifie si le chef de service peut accéder à un service
  canAccessService(serviceId: number): boolean {
    if (this.isDirecteur()) return true;
    if (this.userServiceId() === serviceId) return true;
    // Vérifier si remplaçant de ce service
    const u = this.currentUser();
    if (u?.replacement_service_id === serviceId) {
      const until = u?.replacement_until ? new Date(u.replacement_until) : null;
      if (until && until > new Date()) return true;
    }
    return false;
  }

  // Vérifie accès hôpital
  canAccessHospital(hospitalId: number): boolean {
    if (this.isDirecteur()) return true;
    return this.userHospitalId() === hospitalId;
  }
}