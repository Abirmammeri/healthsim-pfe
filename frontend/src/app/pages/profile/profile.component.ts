// src/app/pages/profile/profile.component.ts

import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/auth.service';

import { environment } from '../../../environments/environment';
const BASE = environment.apiUrl;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background overflow-y-auto">

  <div class="px-6 py-5 border-b bg-card flex items-center gap-4">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
         [style.background]="auth.isDirecteur()?'linear-gradient(135deg,#00BCD4,#0288D1)':'linear-gradient(135deg,#43A047,#2E7D32)'">
      <lucide-icon [name]="auth.isDirecteur()?'brain':'stethoscope'" class="w-7 h-7 text-white"></lucide-icon>
    </div>
    <div>
      <h1 class="text-xl font-bold text-foreground">{{ auth.displayName() }}</h1>
      <p class="text-sm text-muted-foreground">
        {{ auth.isDirecteur() ? 'Directeur' : 'Chef de service' }}
        <span *ngIf="auth.currentUser()?.service"> — {{ auth.currentUser()?.service?.name }}</span>
      </p>
    </div>
    <div class="ml-auto">
      <span class="text-xs px-3 py-1 rounded-full font-semibold"
            [style.background]="auth.currentUser()?.has_face?'#43A04715':'#FB8C0015'"
            [style.color]="auth.currentUser()?.has_face?'#43A047':'#FB8C00'">
        {{ auth.currentUser()?.has_face ? '✓ Visage enregistre' : 'Pas de visage' }}
      </span>
    </div>
  </div>

  <div class="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5">

    <div *ngIf="msg()" class="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
         [style.background]="msgType()==='ok'?'#43A04715':'#E5393515'"
         [style.border]="'1px solid ' + (msgType()==='ok'?'#43A04740':'#E5393540')"
         [style.color]="msgType()==='ok'?'#43A047':'#E53935'">
      <lucide-icon [name]="msgType()==='ok'?'check-circle':'alert-circle'" class="w-4 h-4"></lucide-icon>
      {{ msg() }}
    </div>

    <div class="flex gap-2 border-b border-border overflow-x-auto">
      <button *ngFor="let tab of tabs" type="button" (click)="activeTab.set(tab.key)"
              class="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap"
              [style.borderBottomColor]="activeTab()===tab.key?'#00BCD4':'transparent'"
              [style.color]="activeTab()===tab.key?'#00BCD4':'var(--muted-foreground)'">
        <lucide-icon [name]="tab.icon" class="w-4 h-4 inline mr-1.5"></lucide-icon>
        {{ tab.label }}
      </button>
    </div>

    <!-- PROFIL -->
    <div *ngIf="activeTab()==='profile'" class="space-y-4">
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-4 flex items-center gap-2">
          <lucide-icon name="users" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Informations personnelles
        </h2>

        <div *ngIf="!profileUnlocked()" class="mb-5 p-4 rounded-xl border" style="background:#FB8C0008;border-color:#FB8C0030">
          <p class="text-sm font-semibold mb-3 flex items-center gap-2" style="color:#FB8C00">
            <lucide-icon name="alert-triangle" class="w-4 h-4"></lucide-icon>
            Verifiez votre identite pour modifier vos informations
          </p>
          <div class="flex gap-3">
            <input [(ngModel)]="profilePassword" type="password" placeholder="Entrez votre mot de passe"
                   class="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"
                   (keydown.enter)="unlockProfile()"/>
            <button type="button" (click)="unlockProfile()" [disabled]="loading() || !profilePassword"
                    class="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
              <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
              Verifier
            </button>
          </div>
        </div>

        <div [style.opacity]="profileUnlocked() ? '1' : '0.3'" [style.pointerEvents]="profileUnlocked() ? 'auto' : 'none'">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Prenom</label>
              <input [(ngModel)]="profile.prenom" type="text"
                     class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Nom</label>
              <input [(ngModel)]="profile.nom" type="text"
                     class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Telephone</label>
            <input [(ngModel)]="profile.phone" type="tel" placeholder="+213 555 123 456"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-muted/30 rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Email</div>
              <div class="font-medium text-foreground text-sm">{{ auth.currentUser()?.email }}</div>
            </div>
            <div class="bg-muted/30 rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Hopital</div>
              <div class="font-medium text-foreground text-sm">{{ auth.currentUser()?.hospital?.name }}</div>
            </div>
          </div>
          <button type="button" (click)="updateProfile()" [disabled]="loading()"
                  class="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>

    <!-- SECURITE -->
    <div *ngIf="activeTab()==='security'" class="space-y-4">
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-4 flex items-center gap-2">
          <lucide-icon name="check-circle" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Changer d'email
        </h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Nouvel email</label>
            <input [(ngModel)]="emailForm.newEmail" type="email" placeholder="nouveau@email.dz"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Mot de passe actuel</label>
            <input [(ngModel)]="emailForm.password" type="password" placeholder="••••••••"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
        </div>
        <button type="button" (click)="changeEmail()" [disabled]="loading() || !emailForm.newEmail || !emailForm.password"
                class="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
          <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
          Mettre a jour l'email
        </button>
      </div>

      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-4 flex items-center gap-2">
          <lucide-icon name="settings" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
          Changer le mot de passe
        </h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Mot de passe actuel</label>
            <input [(ngModel)]="pwdForm.current" type="password" placeholder="••••••••"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
            <input [(ngModel)]="pwdForm.newPwd" type="password" placeholder="Min. 8 caracteres"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Confirmer</label>
            <input [(ngModel)]="pwdForm.confirm" type="password" placeholder="Repeter"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none"
                   [style.borderColor]="pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm ? '#E53935' : ''"/>
          </div>
        </div>
        <button type="button" (click)="changePassword()" [disabled]="loading() || !pwdForm.current || !pwdForm.newPwd || pwdForm.newPwd !== pwdForm.confirm"
                class="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                style="background:linear-gradient(135deg,#FB8C00,#F57200)">
          <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
          Changer le mot de passe
        </button>
      </div>

      <div *ngIf="auth.isDirecteur()" class="bg-card rounded-2xl border p-6" style="border-color:#FB8C0030">
        <h2 class="font-bold mb-2 flex items-center gap-2" style="color:#FB8C00">
          <lucide-icon name="pause-circle" class="w-4 h-4"></lucide-icon>
          Desactiver mon compte
        </h2>
        <p class="text-sm text-muted-foreground mb-4">Le compte sera desactive. Vous ne pourrez plus vous connecter jusqu'a reactivation par un administrateur.</p>
        <div *ngIf="!showDeactivateConfirm()">
          <button type="button" (click)="showDeactivateConfirm.set(true)" class="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style="background:#FB8C00">
            Desactiver mon compte
          </button>
        </div>
        <div *ngIf="showDeactivateConfirm()" class="space-y-3">
          <input [(ngModel)]="deactivatePassword" type="password" placeholder="Entrez votre mot de passe pour confirmer"
                 class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                 style="border-color:#FB8C0040;background:#FB8C0008"/>
          <div class="flex gap-3">
            <button type="button" (click)="showDeactivateConfirm.set(false)" class="flex-1 py-2 rounded-xl border border-border text-sm">Annuler</button>
            <button type="button" (click)="deactivateAccount()" [disabled]="loading() || !deactivatePassword"
                    class="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style="background:#FB8C00">
              Confirmer la desactivation
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VISAGE -->
    <div *ngIf="activeTab()==='face'" class="space-y-4">
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-2 flex items-center gap-2">
          <lucide-icon name="users" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Reconnaissance faciale IA
        </h2>
        <p class="text-sm text-muted-foreground mb-5">Enregistrez votre visage pour vous connecter via FaceNet512.</p>

        <div class="flex items-center gap-3 mb-5 p-3 rounded-xl"
             [style.background]="auth.currentUser()?.has_face?'#43A04710':'#FB8C0010'"
             [style.border]="'1px solid ' + (auth.currentUser()?.has_face?'#43A04730':'#FB8C0030')">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [style.background]="auth.currentUser()?.has_face?'#43A04720':'#FB8C0020'">
            <lucide-icon [name]="auth.currentUser()?.has_face?'check-circle':'alert-circle'" class="w-5 h-5"
                         [style.color]="auth.currentUser()?.has_face?'#43A047':'#FB8C00'"></lucide-icon>
          </div>
          <div>
            <div class="font-semibold text-foreground text-sm">{{ auth.currentUser()?.has_face ? 'Visage enregistre' : 'Aucun visage enregistre' }}</div>
            <div class="text-xs text-muted-foreground">{{ auth.currentUser()?.has_face ? 'Connexion faciale active' : 'Enregistrez votre visage' }}</div>
          </div>
        </div>

        <div class="relative rounded-2xl overflow-hidden mb-4" style="background:#000;aspect-ratio:16/9;max-height:300px">
          <video #faceVideoEl autoplay playsinline muted class="w-full h-full object-cover"></video>
          <canvas #faceCanvasEl class="hidden"></canvas>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-40 h-40 rounded-full border-2 opacity-50" style="border-color:#00BCD4"></div>
          </div>
          <div *ngIf="faceCaptured()" class="absolute inset-0 flex items-center justify-center" style="background:rgba(67,160,71,0.3)">
            <lucide-icon name="check-circle" class="w-14 h-14" style="color:#43A047"></lucide-icon>
          </div>
          <div *ngIf="!faceStreamActive()" class="absolute inset-0 flex items-center justify-center" style="background:rgba(0,0,0,0.7)">
            <button type="button" (click)="startFaceCamera()" class="px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                    style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
              <lucide-icon name="users" class="w-4 h-4"></lucide-icon>Activer la camera
            </button>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="button" (click)="captureFace()" [disabled]="!faceStreamActive()"
                  class="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted disabled:opacity-50 text-foreground flex items-center justify-center gap-2">
            <lucide-icon name="users" class="w-4 h-4"></lucide-icon>{{ faceCaptured() ? 'Recapturer' : 'Capturer' }}
          </button>
          <button type="button" (click)="saveFace()" [disabled]="loading() || !faceCaptured()"
                  class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            Enregistrer le visage
          </button>
        </div>

        <div *ngIf="auth.currentUser()?.has_face" class="mt-3 pt-3 border-t border-border">
          <button type="button" (click)="deleteFace()" class="text-sm flex items-center gap-2 hover:underline" style="color:#E53935">
            <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>Supprimer mon visage enregistre
          </button>
        </div>
      </div>
    </div>

    <!-- REMPLACEMENT — directeur uniquement -->
    <div *ngIf="activeTab()==='replacement' && auth.isDirecteur()" class="space-y-4">
      <div class="bg-card rounded-2xl border border-border p-6">
        <h2 class="font-bold text-foreground mb-4 flex items-center gap-2">
          <lucide-icon name="clock" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Gerer les remplacements
        </h2>
        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Service</label>
            <select [(ngModel)]="dirReplForm.serviceId" (ngModelChange)="loadServiceColleagues($event)"
                    class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option [ngValue]="null">— Choisir un service —</option>
              <option *ngFor="let s of allServicesForRepl()" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Remplacant</label>
            <select [(ngModel)]="dirReplForm.userId" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option [ngValue]="null">— Choisir un medecin du service —</option>
              <option *ngFor="let u of serviceColleagues()" [ngValue]="u.id">{{ u.name }}</option>
            </select>
            <p *ngIf="dirReplForm.serviceId && serviceColleagues().length === 0" class="text-xs text-muted-foreground mt-1">Aucun medecin disponible dans ce service.</p>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Jusqu'au</label>
            <input [(ngModel)]="dirReplForm.until" type="date" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Raison</label>
            <input [(ngModel)]="dirReplForm.reason" type="text" placeholder="Ex: Conge annuel"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
        </div>
        <button type="button" (click)="setReplacementByDirecteur()"
                [disabled]="loading() || !dirReplForm.serviceId || !dirReplForm.userId || !dirReplForm.until"
                class="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
          <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
          Assigner le remplacant
        </button>
      </div>
    </div>

    <!-- UTILISATEURS — directeur uniquement -->
    <div *ngIf="activeTab()==='users' && auth.isDirecteur()" class="space-y-4">
      <div class="bg-card rounded-2xl border border-border p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-foreground flex items-center gap-2">
            <lucide-icon name="clock" class="w-4 h-4" style="color:#FB8C00"></lucide-icon>
            Comptes en attente
            <span *ngIf="pendingUsers().length > 0" class="text-xs font-bold px-2 py-0.5 rounded-full text-white" style="background:#FB8C00">{{ pendingUsers().length }}</span>
          </h2>
          <button type="button" (click)="loadUsers()" class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <lucide-icon name="loader-2" class="w-3 h-3"></lucide-icon>Actualiser
          </button>
        </div>
        <div *ngIf="pendingUsers().length === 0" class="text-center py-6 text-sm text-muted-foreground">Aucun compte en attente</div>
        <div class="space-y-3">
          <div *ngFor="let u of pendingUsers()" class="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#43A047,#2E7D32)">
              <lucide-icon name="stethoscope" class="w-5 h-5 text-white"></lucide-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-foreground text-sm">{{ u.name }}</div>
              <div class="text-xs text-muted-foreground">{{ u.email }}</div>
              <div class="text-xs text-muted-foreground">
                {{ u.service ?? 'Service non defini' }} · {{ u.created_at }}
              </div>
              <div *ngIf="u.has_face" class="text-[10px] mt-0.5" style="color:#43A047">✓ Visage enregistre</div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button type="button" (click)="approveUser(u.id, 'approve')"
                      [disabled]="approvingId() !== null && approvingId() === u.id"
                      class="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
                      style="background:#43A047">
                <lucide-icon [name]="approvingId()===u.id && approvingId()!==null?'loader-2':'check-circle'" class="w-3 h-3" [class.animate-spin]="approvingId()===u.id && approvingId()!==null"></lucide-icon>
                Approuver
              </button>
              <button type="button" (click)="approveUser(u.id, 'reject')"
                      [disabled]="approvingId() !== null && approvingId() === u.id"
                      class="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                      style="background:#E53935">
                Rejeter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card rounded-2xl border border-border p-5">
        <h2 class="font-bold text-foreground mb-4 flex items-center gap-2">
          <lucide-icon name="users" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          Tous les comptes
        </h2>
        <div class="space-y-2">
          <div *ngFor="let u of allUsers()" class="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                 [style.background]="u.role==='directeur'?'linear-gradient(135deg,#00BCD4,#0288D1)':'linear-gradient(135deg,#43A047,#2E7D32)'">
              <lucide-icon [name]="u.role==='directeur'?'brain':'stethoscope'" class="w-4 h-4 text-white"></lucide-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-foreground text-sm">{{ u.name }}</div>
              <div class="text-xs text-muted-foreground">{{ u.email }} · {{ u.service ?? u.role }}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  [style.background]="!u.is_active?'rgba(0,0,0,0.08)':u.status==='active'?'#43A04715':u.status==='pending'?'#FB8C0015':'#E5393515'"
                  [style.color]="!u.is_active?'#888':u.status==='active'?'#43A047':u.status==='pending'?'#FB8C00':'#E53935'">
              {{ !u.is_active ? 'Desactive' : u.status === 'active' ? 'Actif' : u.status === 'pending' ? 'En attente' : 'Rejete' }}
            </span>
            <button type="button" (click)="toggleUserStatus(u.id, u.is_active)"
                    [title]="u.is_active ? 'Desactiver ce compte' : 'Activer ce compte'"
                    class="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                    [style.background]="u.is_active ? '#FB8C0015' : '#43A04715'"
                    [style.color]="u.is_active ? '#FB8C00' : '#43A047'">
              <lucide-icon [name]="u.is_active ? 'pause-circle' : 'play-circle'" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
})
export class ProfileComponent implements OnInit {
  auth: AuthService = inject(AuthService);
  private http = inject(HttpClient);

  loading               = signal(false);
  approvingId           = signal<number|null>(null);
  msg                   = signal<string|null>(null);
  msgType               = signal<'ok'|'err'>('ok');
  activeTab             = signal('profile');
  showDeactivateConfirm = signal(false);
  faceStreamActive      = signal(false);
  faceCaptured       = signal(false);
  profileUnlocked    = signal(false);
  pendingUsers       = signal<any[]>([]);
  allUsers           = signal<any[]>([]);
  allServicesForRepl = signal<any[]>([]);
  serviceColleagues  = signal<any[]>([]);  // médecins du service sélectionné
  dirReplForm = { serviceId: null as number|null, userId: null as number|null, until: '', reason: '' };

  @ViewChild('faceVideoEl')  faceVideoEl!:  ElementRef<HTMLVideoElement>;
  @ViewChild('faceCanvasEl') faceCanvasEl!: ElementRef<HTMLCanvasElement>;

  private faceStream: MediaStream|null = null;
  private faceImage = '';

  profile             = { prenom: '', nom: '', phone: '' };
  profilePassword     = '';
  emailForm           = { newEmail: '', password: '' };
  pwdForm             = { current: '', newPwd: '', confirm: '' };
  deactivatePassword  = '';

  get tabs() {
    const base = [
      { key: 'profile',  label: 'Profil',    icon: 'users' },
      { key: 'security', label: 'Securite',  icon: 'settings' },
      { key: 'face',     label: 'Visage IA', icon: 'activity' },
    ];
    if (this.auth.isDirecteur()) {
      base.push({ key: 'replacement', label: 'Remplacement', icon: 'clock' });
      base.push({ key: 'users', label: 'Utilisateurs', icon: 'brain' });
    }
    return base;
  }

  ngOnInit() {
    const u = this.auth.currentUser();
    if (u) {
      this.profile.prenom = u.prenom ?? '';
      this.profile.nom    = u.nom    ?? '';
      this.profile.phone  = (u as any).phone ?? '';
    }
    if (this.auth.isDirecteur()) {
      this.loadUsers();
      this.loadAllServicesForRepl();
    }
  }

  showMsg(text: string, type: 'ok'|'err' = 'ok') {
    this.msg.set(text); this.msgType.set(type);
    setTimeout(() => this.msg.set(null), 4000);
  }

  unlockProfile() {
    if (!this.profilePassword) return;
    this.loading.set(true);
    this.http.post<any>(`${BASE}/auth/verify-password`, { password: this.profilePassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.profileUnlocked.set(true);
        this.profilePassword = '';
        this.showMsg('Identite verifiee. Vous pouvez modifier vos informations.');
      },
      error: err => {
        this.loading.set(false);
        this.showMsg(err.error?.message || 'Mot de passe incorrect.', 'err');
      }
    });
  }

  updateProfile() {
    if (!this.profileUnlocked()) return;
    this.loading.set(true);
    this.http.put<any>(`${BASE}/auth/update-profile`, {
      nom:    this.profile.nom,
      prenom: this.profile.prenom,
      phone:  this.profile.phone,
    }).subscribe({
      next: res => {
        this.loading.set(false);
        this.auth.currentUser.set(res.user);
        // Mettre à jour les champs locaux avec les données retournées
        this.profile.phone  = res.user?.phone  ?? this.profile.phone;
        this.profile.nom    = res.user?.nom    ?? this.profile.nom;
        this.profile.prenom = res.user?.prenom ?? this.profile.prenom;
        this.profileUnlocked.set(false);
        this.showMsg('Profil mis a jour avec succes !');
      },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur.', 'err'); }
    });
  }

  changeEmail() {
    this.loading.set(true);
    this.http.put<any>(`${BASE}/auth/change-email`, { email: this.emailForm.newEmail, password: this.emailForm.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.showMsg('Email mis a jour !');
        this.emailForm = { newEmail: '', password: '' };
        this.auth.init();
      },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur.', 'err'); }
    });
  }

  changePassword() {
    this.loading.set(true);
    this.http.put<any>(`${BASE}/auth/change-password`, {
      current_password: this.pwdForm.current,
      new_password:     this.pwdForm.newPwd,
      confirm_password: this.pwdForm.confirm,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.showMsg('Mot de passe mis a jour !');
        this.pwdForm = { current: '', newPwd: '', confirm: '' };
      },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur.', 'err'); }
    });
  }

  deactivateAccount() {
    this.loading.set(true);
    this.http.patch<any>(`${BASE}/auth/deactivate-account`, { password: this.deactivatePassword }).subscribe({
      next: () => { this.loading.set(false); this.auth.logout(); },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur.', 'err'); }
    });
  }

  toggleUserStatus(id: number, isActive: boolean) {
    const action = isActive ? 'desactiver' : 'activer';
    if (!confirm(`Voulez-vous ${action} ce compte ?`)) return;
    this.http.patch<any>(`${BASE}/auth/toggle-user-status/${id}`, {}).subscribe({
      next: res => {
        this.showMsg(res.message);
        this.allUsers.update(users => users.map(u =>
          u.id === id ? { ...u, is_active: res.is_active, status: res.status } : u
        ));
      },
      error: err => this.showMsg(err.error?.message || 'Erreur.', 'err')
    });
  }

  async startFaceCamera() {
    try {
      this.faceStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => {
        if (this.faceVideoEl?.nativeElement) {
          this.faceVideoEl.nativeElement.srcObject = this.faceStream;
          this.faceStreamActive.set(true);
        }
      }, 300);
    } catch { this.showMsg('Camera inaccessible.', 'err'); }
  }

  captureFace() {
    const v = this.faceVideoEl.nativeElement;
    const c = this.faceCanvasEl.nativeElement;
    c.width = 320; c.height = 240;
    c.getContext('2d')!.drawImage(v, 0, 0, 320, 240);
    this.faceImage = c.toDataURL('image/jpeg', 0.5);
    this.faceCaptured.set(true);
  }

  saveFace() {
    this.loading.set(true);
    this.http.post<any>(`${BASE}/auth/register-face`, { image: this.faceImage }).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.currentUser.update(u => u ? { ...u, has_face: true } : u);
        this.showMsg('Visage enregistre avec succes !');
        this.faceStream?.getTracks().forEach(t => t.stop());
        this.faceStreamActive.set(false);
        this.faceCaptured.set(false);
      },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur IA.', 'err'); }
    });
  }

  deleteFace() {
    if (!confirm('Supprimer votre visage enregistre ?')) return;
    this.http.delete<any>(`${BASE}/auth/delete-face`).subscribe({
      next: () => {
        this.auth.currentUser.update(u => u ? { ...u, has_face: false } : u);
        this.showMsg('Visage supprime.');
      },
      error: err => this.showMsg(err.error?.message || 'Erreur.', 'err')
    });
  }

  loadAllServicesForRepl() {
    const hId = this.auth.currentUser()?.hospital_id;
    if (!hId) return;
    this.http.get<any[]>(`${BASE}/hospitals/${hId}/services`).subscribe({
      next: s => this.allServicesForRepl.set(s), error: () => {}
    });
  }

  // Charger les médecins du service depuis la table doctors
  loadServiceColleagues(serviceId: number|null) {
    this.serviceColleagues.set([]);
    this.dirReplForm.userId = null;
    if (!serviceId) return;
    this.http.get<any[]>(`${BASE}/doctors/by-service/${serviceId}`).subscribe({
      next: doctors => {
        this.serviceColleagues.set(doctors.map((d: any) => ({
          id:   d.id,
          name: d.nom_complet + ' — ' + d.grade_label + ' (' + d.specialite + ')',
        })));
      },
      error: () => {}
    });
  }

  setReplacementByDirecteur() {
    if (!this.dirReplForm.serviceId || !this.dirReplForm.userId || !this.dirReplForm.until) return;
    this.loading.set(true);
    this.http.post<any>(`${BASE}/services/${this.dirReplForm.serviceId}/set-replacement`, {
      replacement_user_id: this.dirReplForm.userId,
      replacement_until:   this.dirReplForm.until,
      replacement_reason:  this.dirReplForm.reason,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.showMsg('Remplacant assigne avec succes !');
        this.dirReplForm = { serviceId: null, userId: null, until: '', reason: '' };
        this.serviceColleagues.set([]);
      },
      error: err => { this.loading.set(false); this.showMsg(err.error?.message || 'Erreur.', 'err'); }
    });
  }

  loadUsers() {
    this.http.get<any[]>(`${BASE}/auth/pending-users`).subscribe({
      next: u => this.pendingUsers.set(u), error: () => {}
    });
    this.http.get<any[]>(`${BASE}/auth/all-users`).subscribe({
      next: u => this.allUsers.set(u), error: () => {}
    });
  }

  approveUser(id: number, action: string) {
    this.approvingId.set(id);
    this.http.post<any>(`${BASE}/auth/approve-user/${id}`, { action }).subscribe({
      next: () => {
        this.showMsg(action === 'approve' ? 'Compte approuve !' : 'Compte rejete.');
        this.pendingUsers.set([]);
        this.allUsers.set([]);
        this.approvingId.set(null);
        setTimeout(() => this.loadUsers(), 1000);
      },
      error: err => {
        this.approvingId.set(null);
        this.showMsg(err.error?.message || 'Erreur.', 'err');
      }
    });
  }

  deleteUser(id: number) {
    if (!confirm('Supprimer ce compte ?')) return;
    this.http.delete<any>(`${BASE}/auth/delete-user/${id}`).subscribe({
      next: () => {
        this.showMsg('Compte supprime.');
        this.pendingUsers.set([]);
        this.allUsers.set([]);
        setTimeout(() => this.loadUsers(), 1000);
      },
      error: err => this.showMsg(err.error?.message || 'Erreur.', 'err')
    });
  }
}