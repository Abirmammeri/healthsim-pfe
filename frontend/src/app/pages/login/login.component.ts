// src/app/pages/login/login.component.ts
import { Component, inject, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/auth.service';
import { Router } from '@angular/router';

const BASE = 'http://localhost:8000/api';
type PageMode = 'login' | 'register' | 'forgot' | 'otp';
type LoginMode = 'password' | 'face';
type RegStep = 'info' | 'verify' | 'password' | 'phone' | 'face' | 'done';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="min-h-screen flex items-center justify-center p-4"
     style="background:linear-gradient(135deg,#0d1117 0%,#161b22 50%,#0d1117 100%)">

  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute w-96 h-96 rounded-full opacity-10 blur-3xl" style="background:#00BCD4;top:-10%;left:-10%;animation:float 8s ease-in-out infinite"></div>
    <div class="absolute w-80 h-80 rounded-full opacity-8 blur-3xl" style="background:#0288D1;bottom:-10%;right:-10%;animation:float 10s ease-in-out infinite reverse"></div>
  </div>

  <div class="w-full max-w-md relative z-10">
    <div class="text-center mb-6">
      <div class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-2xl"
           style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="activity" class="w-10 h-10 text-white"></lucide-icon>
      </div>
      <h1 class="text-3xl font-bold text-white">HealthSim</h1>
      <p class="text-sm mt-1" style="color:#00BCD4">Systeme d'Aide a la Decision Hospitaliere</p>
    </div>

    <div class="rounded-3xl border p-7 shadow-2xl"
         style="background:rgba(22,27,34,0.95);border-color:rgba(0,188,212,0.2)">

      <div *ngIf="error()" class="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
           style="background:#E5393515;border:1px solid #E5393540;color:#E53935">
        <lucide-icon name="alert-circle" class="w-4 h-4 flex-shrink-0"></lucide-icon>{{ error() }}
      </div>
      <div *ngIf="success()" class="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
           style="background:#43A04715;border:1px solid #43A04740;color:#43A047">
        <lucide-icon name="check-circle" class="w-4 h-4 flex-shrink-0"></lucide-icon>{{ success() }}
      </div>

      <!-- LOGIN -->
      <ng-container *ngIf="page() === 'login'">
        <h2 class="text-xl font-bold text-white mb-1">Connexion</h2>
        <p class="text-sm mb-5" style="color:#8b949e">Acces a votre espace de decision</p>

        <div class="flex gap-2 mb-5 p-1 rounded-xl" style="background:rgba(255,255,255,0.05)">
          <button (click)="setLoginMode('password')"
                  class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  [style.background]="loginMode()==='password'?'linear-gradient(135deg,#00BCD4,#0288D1)':'transparent'"
                  [style.color]="loginMode()==='password'?'white':'#8b949e'">
            <lucide-icon name="settings" class="w-4 h-4"></lucide-icon>Mot de passe
          </button>
          <button (click)="setLoginMode('face')"
                  class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  [style.background]="loginMode()==='face'?'linear-gradient(135deg,#00BCD4,#0288D1)':'transparent'"
                  [style.color]="loginMode()==='face'?'white':'#8b949e'">
            <lucide-icon name="users" class="w-4 h-4"></lucide-icon>Visage IA
          </button>
        </div>

        <div class="mb-4" *ngIf="loginMode()==='password'">
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Email</label>
          <input [(ngModel)]="email" type="email" placeholder="votre@email.dz"
                 class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                 style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
        </div>

        <ng-container *ngIf="loginMode()==='password'">
          <div class="mb-3">
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Mot de passe</label>
            <div class="relative">
              <input [(ngModel)]="password" [type]="showPwd()?'text':'password'" placeholder="••••••••"
                     (keydown.enter)="submitLogin()"
                     class="w-full px-4 py-3 pr-10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                     style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
              <button (click)="showPwd.set(!showPwd())" class="absolute right-3 top-1/2 -translate-y-1/2" style="color:#8b949e">
                <lucide-icon [name]="showPwd()?'check-circle':'alert-circle'" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
          <div class="flex justify-end mb-5">
            <button (click)="goForgot()" class="text-xs hover:underline" style="color:#00BCD4">Mot de passe oublie ?</button>
          </div>
          <button (click)="submitLogin()" [disabled]="loading() || !email || !password"
                  class="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            {{ loading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </ng-container>

        <ng-container *ngIf="loginMode()==='face'">
          <div class="relative rounded-2xl overflow-hidden mb-4" style="background:#000;aspect-ratio:4/3">
            <video #videoEl autoplay playsinline muted class="w-full h-full object-cover"></video>
            <canvas #canvasEl class="hidden"></canvas>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-52 h-52 rounded-full border-2 flex items-center justify-center"
                   [style.borderColor]="faceResult()?.verified ? '#43A047' : faceResult()?.verified === false ? '#E53935' : '#00BCD4'"
                   [style.opacity]="cameraActive() ? '0.8' : '0.3'">
                <div class="w-full h-0.5 animate-pulse" [style.background]="faceResult()?.verified ? '#43A047' : '#00BCD4'"></div>
              </div>
            </div>
            <div class="absolute top-3 left-3 right-3 flex justify-center">
              <div *ngIf="loading()" class="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2"
                   style="background:rgba(0,188,212,0.8)">
                <lucide-icon name="loader-2" class="w-3 h-3 animate-spin"></lucide-icon>Analyse IA en cours...
              </div>
              <div *ngIf="!loading() && cameraActive() && !faceResult()" class="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                   style="background:rgba(0,0,0,0.6)">
                Placez votre visage dans le cercle
              </div>
            </div>
            <div *ngIf="!cameraActive()" class="absolute inset-0 flex items-center justify-center" style="background:rgba(0,0,0,0.8)">
              <div class="text-center">
                <lucide-icon name="users" class="w-10 h-10 mx-auto mb-2" style="color:#00BCD4"></lucide-icon>
                <p class="text-white text-sm">Activation camera...</p>
              </div>
            </div>
            <div *ngIf="faceResult()" class="absolute bottom-3 left-3 right-3 text-center px-3 py-2 rounded-xl text-sm font-bold"
                 [style.background]="faceResult()!.verified?'rgba(67,160,71,0.9)':'rgba(229,57,53,0.9)'" style="color:white">
              {{ faceResult()!.verified ? '✓ Identifie — ' + faceResult()!.similarity + '% confiance' : '✗ Visage non reconnu' }}
            </div>
          </div>
          <button (click)="scanFaceAuto()" [disabled]="loading() || !cameraActive()"
                  class="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'users'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            {{ loading() ? 'Identification...' : 'Scanner mon visage' }}
          </button>
        </ng-container>

        <p class="text-center text-sm mt-5" style="color:#8b949e">
          Pas de compte ?
          <button (click)="goRegister()" class="font-semibold hover:underline ml-1" style="color:#00BCD4">Creer un compte</button>
        </p>
      </ng-container>

      <!-- INSCRIPTION -->
      <ng-container *ngIf="page() === 'register'">
        <div class="flex items-center gap-3 mb-5">
          <button (click)="backToLogin()" class="p-2 rounded-xl hover:bg-white/10">
            <lucide-icon name="arrow-left" class="w-4 h-4 text-white"></lucide-icon>
          </button>
          <div>
            <h2 class="text-xl font-bold text-white">Creer un compte</h2>
            <div class="flex gap-1 mt-1">
              <div *ngFor="let s of regSteps; let i=index" class="h-1 rounded-full flex-1"
                   [style.background]="regStepIndex() >= i ? '#00BCD4' : 'rgba(255,255,255,0.1)'"></div>
            </div>
          </div>
        </div>

        <ng-container *ngIf="regStep() === 'info'">
          <p class="text-xs mb-4" style="color:#8b949e">Etape 1/5 — Informations personnelles</p>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Prenom *</label>
                <input [(ngModel)]="reg.prenom" type="text" placeholder="Ahmed"
                       class="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                       style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Nom *</label>
                <input [(ngModel)]="reg.nom" type="text" placeholder="Meziane"
                       class="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                       style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Email professionnel *</label>
              <input [(ngModel)]="reg.email" type="email" placeholder="votre@email.dz"
                     class="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                     style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Structure hospitaliere *</label>
              <select [(ngModel)]="reg.hospital_id" (ngModelChange)="loadServices($event)"
                      class="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)">
                <option [ngValue]="null" style="background:#161b22">— Selectionner —</option>
                <option *ngFor="let h of hospitals()" [ngValue]="h.id" style="background:#161b22">{{ h.name }}</option>
              </select>
            </div>
            <div *ngIf="services().length > 0">
              <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Service *</label>
              <select [(ngModel)]="reg.service_id"
                      class="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                      style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)">
                <option [ngValue]="null" style="background:#161b22">— Selectionner votre service —</option>
                <option *ngFor="let s of services()" [ngValue]="s.id" style="background:#161b22">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <button (click)="sendEmailVerification()" [disabled]="loading() || !reg.prenom || !reg.nom || !reg.email || !reg.hospital_id"
                  class="w-full mt-5 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            Verifier mon email
          </button>
        </ng-container>

        <ng-container *ngIf="regStep() === 'verify'">
          <p class="text-xs mb-4" style="color:#8b949e">Etape 2/5 — Verification email</p>
          <div class="text-center mb-4 p-3 rounded-xl" style="background:rgba(0,188,212,0.1);border:1px solid rgba(0,188,212,0.3)">
            <p class="text-white text-sm">Code envoye a</p>
            <p class="font-bold" style="color:#00BCD4">{{ reg.email }}</p>
          </div>
          <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Code OTP (6 chiffres)</label>
          <input [(ngModel)]="reg.otp" type="text" maxlength="6" placeholder="123456"
                 class="w-full px-4 py-3 rounded-xl text-white text-center text-2xl tracking-widest mb-4 focus:outline-none"
                 style="background:rgba(255,255,255,0.06);border:1px solid rgba(0,188,212,0.4)"/>
          <button (click)="verifyEmailOtp()" [disabled]="loading() || reg.otp.length < 6"
                  class="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            Verifier le code
          </button>
          <button (click)="sendEmailVerification()" class="w-full mt-2 py-2 text-xs" style="color:#8b949e">Renvoyer le code</button>
        </ng-container>

        <ng-container *ngIf="regStep() === 'password'">
          <p class="text-xs mb-4" style="color:#8b949e">Etape 3/5 — Mot de passe</p>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Mot de passe *</label>
              <div class="relative">
                <input [(ngModel)]="reg.password" [type]="showRegPwd()?'text':'password'" placeholder="Min. 8 caracteres"
                       class="w-full px-3 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                       style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
                <button (click)="showRegPwd.set(!showRegPwd())" class="absolute right-3 top-1/2 -translate-y-1/2" style="color:#8b949e">
                  <lucide-icon [name]="showRegPwd()?'check-circle':'alert-circle'" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Confirmer le mot de passe *</label>
              <input [(ngModel)]="reg.confirmPassword" [type]="showRegPwd()?'text':'password'" placeholder="Repeter le mot de passe"
                     class="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                     [style.borderColor]="reg.confirmPassword && reg.password !== reg.confirmPassword ? '#E53935' : 'rgba(255,255,255,0.1)'"
                     style="background:rgba(255,255,255,0.06);border:1px solid"/>
              <p *ngIf="reg.confirmPassword && reg.password !== reg.confirmPassword" class="text-xs mt-1" style="color:#E53935">
                Les mots de passe ne correspondent pas
              </p>
            </div>
            <div class="space-y-1">
              <div class="flex gap-1">
                <div *ngFor="let i of [1,2,3,4]" class="h-1 flex-1 rounded-full"
                     [style.background]="pwdStrength() >= i ? pwdStrengthColor() : 'rgba(255,255,255,0.1)'"></div>
              </div>
              <p class="text-[10px]" [style.color]="pwdStrengthColor()">{{ pwdStrengthLabel() }}</p>
            </div>
          </div>
          <button (click)="goToPhone()" [disabled]="!reg.password || reg.password !== reg.confirmPassword || reg.password.length < 8"
                  class="w-full mt-5 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>Continuer
          </button>
        </ng-container>

        <ng-container *ngIf="regStep() === 'phone'">
          <p class="text-xs mb-4" style="color:#8b949e">Etape 4/5 — Telephone (pour recuperation)</p>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#8b949e">Numero de telephone</label>
            <input [(ngModel)]="reg.phone" type="tel" placeholder="+213 555 123 456"
                   class="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                   style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
            <p class="text-[10px] mt-1" style="color:#8b949e">Optionnel — permet la recuperation par SMS</p>
          </div>
          <div class="flex gap-3 mt-5">
            <button (click)="regStep.set('face')" class="flex-1 py-3 rounded-xl text-white font-bold text-sm" style="background:rgba(255,255,255,0.1)">Passer</button>
            <button (click)="regStep.set('face')" class="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
              <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>Continuer
            </button>
          </div>
        </ng-container>

        <ng-container *ngIf="regStep() === 'face'">
          <p class="text-xs mb-4" style="color:#8b949e">Etape 5/5 — Reconnaissance faciale (optionnelle)</p>
          <div class="relative rounded-2xl overflow-hidden mb-3" style="background:#000;aspect-ratio:4/3">
            <video #regVideoEl autoplay playsinline muted class="w-full h-full object-cover"></video>
            <canvas #regCanvasEl class="hidden"></canvas>
            <div *ngIf="regFaceCaptured()" class="absolute inset-0 flex items-center justify-center" style="background:rgba(67,160,71,0.3)">
              <lucide-icon name="check-circle" class="w-16 h-16" style="color:#43A047"></lucide-icon>
            </div>
            <div *ngIf="!regCameraActive()" class="absolute inset-0 flex items-center justify-center" style="background:rgba(0,0,0,0.8)">
              <button (click)="startRegCamera()" class="px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                      style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
                <lucide-icon name="users" class="w-4 h-4"></lucide-icon>Activer la camera
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="regFaceCaptured()?'#43A047':'#8b949e'"></div>
            <span class="text-xs" style="color:#8b949e">{{ regFaceCaptured() ? 'Visage capture ✓' : 'Visage non capture' }}</span>
            <button (click)="captureRegFace()" class="ml-auto text-xs px-3 py-1 rounded-lg font-semibold" style="background:rgba(0,188,212,0.15);color:#00BCD4">
              {{ regFaceCaptured() ? 'Recapturer' : 'Capturer' }}
            </button>
          </div>
          <div class="flex gap-3">
            <button (click)="submitRegister()" [disabled]="loading()" class="flex-1 py-3 rounded-xl text-white font-bold text-sm" style="background:rgba(255,255,255,0.1)">Sans visage</button>
            <button (click)="submitRegister()" [disabled]="loading()" class="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
              <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
              {{ loading() ? 'Creation...' : 'Creer le compte' }}
            </button>
          </div>
        </ng-container>

        <ng-container *ngIf="regStep() === 'done'">
          <div class="text-center py-4">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:#43A04720">
              <lucide-icon name="check-circle" class="w-8 h-8" style="color:#43A047"></lucide-icon>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Compte cree !</h3>
            <p class="text-sm mb-4" style="color:#8b949e">En attente de validation par le directeur.</p>
            <button (click)="backToLogin()" class="w-full py-3 rounded-xl text-white font-bold text-sm" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">Retour au login</button>
          </div>
        </ng-container>
      </ng-container>

      <!-- MOT DE PASSE OUBLIÉ -->
      <ng-container *ngIf="page() === 'forgot'">
        <div class="flex items-center gap-3 mb-5">
          <button (click)="page.set('login')" class="p-2 rounded-xl hover:bg-white/10">
            <lucide-icon name="arrow-left" class="w-4 h-4 text-white"></lucide-icon>
          </button>
          <div>
            <h2 class="text-xl font-bold text-white">Mot de passe oublie</h2>
            <p class="text-xs" style="color:#8b949e">Reinitialiser votre mot de passe</p>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Email</label>
            <input [(ngModel)]="forgotEmail" type="email" placeholder="votre@email.dz"
                   class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                   style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-2 uppercase tracking-wider" style="color:#8b949e">Recevoir le code par</label>
            <div class="grid grid-cols-2 gap-2">
              <button (click)="forgotMethod.set('email')" class="py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                      [style.background]="forgotMethod()==='email'?'rgba(0,188,212,0.15)':'transparent'"
                      [style.borderColor]="forgotMethod()==='email'?'#00BCD4':'rgba(255,255,255,0.1)'"
                      [style.color]="forgotMethod()==='email'?'#00BCD4':'#8b949e'">
                <lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>Email
              </button>
              <button (click)="forgotMethod.set('sms')" class="py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                      [style.background]="forgotMethod()==='sms'?'rgba(0,188,212,0.15)':'transparent'"
                      [style.borderColor]="forgotMethod()==='sms'?'#00BCD4':'rgba(255,255,255,0.1)'"
                      [style.color]="forgotMethod()==='sms'?'#00BCD4':'#8b949e'">
                <lucide-icon name="users" class="w-4 h-4"></lucide-icon>SMS
              </button>
            </div>
            <div class="mt-2">
              <button (click)="forgotMethod.set('whatsapp')" class="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2"
                      [style.background]="forgotMethod()==='whatsapp'?'rgba(37,211,102,0.15)':'transparent'"
                      [style.borderColor]="forgotMethod()==='whatsapp'?'#25D366':'rgba(255,255,255,0.1)'"
                      [style.color]="forgotMethod()==='whatsapp'?'#25D366':'#8b949e'">
                <lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>WhatsApp
              </button>
            </div>
          </div>
          <!-- Champ téléphone visible uniquement quand SMS sélectionné -->
          <div *ngIf="forgotMethod()==='sms' || forgotMethod()==='whatsapp'">
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">{{ forgotMethod()==='whatsapp' ? 'Numero WhatsApp' : 'Numero de telephone' }}</label>
            <input [(ngModel)]="forgotPhone" type="tel" placeholder="+213770134140"
                   class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                   style="background:rgba(255,255,255,0.06);border:1px solid rgba(0,188,212,0.4)"/>
            <p class="text-[10px] mt-1" style="color:#FB8C00">⚠️ Format requis : +213XXXXXXXXX (sans le 0 initial)</p>
            <p class="text-[10px] mt-0.5" style="color:#8b949e">Exemple : 0770134140 → +213770134140</p>
          </div>
          <button (click)="submitForgot()" [disabled]="loading() || !forgotEmail || ((forgotMethod()==='sms' || forgotMethod()==='whatsapp') && !forgotPhone)"
                  class="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            {{ loading() ? 'Envoi...' : 'Envoyer le code' }}
          </button>
        </div>
      </ng-container>

      <!-- OTP -->
      <ng-container *ngIf="page() === 'otp'">
        <div class="flex items-center gap-3 mb-5">
          <button (click)="page.set('forgot')" class="p-2 rounded-xl hover:bg-white/10">
            <lucide-icon name="arrow-left" class="w-4 h-4 text-white"></lucide-icon>
          </button>
          <div>
            <h2 class="text-xl font-bold text-white">Verification</h2>
            <p class="text-xs" style="color:#8b949e">Code recu par {{ forgotMethod() === 'sms' ? 'SMS' : 'email' }}</p>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Code OTP (6 chiffres)</label>
            <input [(ngModel)]="otp.code" type="text" maxlength="6" placeholder="123456"
                   class="w-full px-4 py-3 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none"
                   style="background:rgba(255,255,255,0.06);border:1px solid rgba(0,188,212,0.4)"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Nouveau mot de passe</label>
            <input [(ngModel)]="otp.newPassword" type="password" placeholder="Min. 8 caracteres"
                   class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                   style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:#8b949e">Confirmer</label>
            <input [(ngModel)]="otp.confirmPassword" type="password" placeholder="Repeter le mot de passe"
                   class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                   [style.borderColor]="otp.confirmPassword && otp.newPassword !== otp.confirmPassword ? '#E53935' : 'rgba(255,255,255,0.1)'"
                   style="background:rgba(255,255,255,0.06);border:1px solid"/>
          </div>
          <button (click)="submitOtp()" [disabled]="loading() || !otp.code || !otp.newPassword || otp.newPassword !== otp.confirmPassword"
                  class="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="loading()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
            {{ loading() ? 'Verification...' : 'Reinitialiser le mot de passe' }}
          </button>
        </div>
      </ng-container>

    </div>

    <p class="text-center text-xs mt-5" style="color:#484f58">HealthSim v1.0 — CHU Ibn Badis Constantine · Algeria</p>
  </div>
</div>

<style>
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
input:focus { border-color:#00BCD4 !important; box-shadow:0 0 0 3px rgba(0,188,212,0.15); }
</style>
  `,
})
export class LoginComponent implements OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  auth: AuthService = inject(AuthService);

  @ViewChild('videoEl')    videoEl!:    ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl')   canvasEl!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('regVideoEl') regVideoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('regCanvasEl')regCanvasEl!:ElementRef<HTMLCanvasElement>;

  page          = signal<PageMode>('login');
  loginMode     = signal<LoginMode>('password');
  regStep       = signal<RegStep>('info');
  loading       = signal(false);
  error         = signal<string|null>(null);
  success       = signal<string|null>(null);
  showPwd       = signal(false);
  showRegPwd    = signal(false);
  cameraActive  = signal(false);
  faceResult    = signal<any>(null);
  regFaceCaptured = signal(false);
  regCameraActive  = signal(false);
  hospitals     = signal<any[]>([]);
  services      = signal<any[]>([]);
  forgotMethod  = signal<'email'|'sms'|'whatsapp'>('email');

  readonly regSteps = ['info','verify','password','phone','face'];
  regStepIndex = () => this.regSteps.indexOf(this.regStep());

  email = ''; password = ''; forgotEmail = ''; forgotPhone = '';
  regFaceImage = '';

  reg = { prenom:'', nom:'', email:'', password:'', confirmPassword:'', phone:'', hospital_id:null as number|null, service_id:null as number|null, otp:'' };
  otp = { code:'', newPassword:'', confirmPassword:'' };

  private stream: MediaStream|null = null;
  private regStream: MediaStream|null = null;
  private scanTimer: any = null;

  pwdStrength(): number {
    const p = this.reg.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }
  pwdStrengthColor(): string {
    const s = this.pwdStrength();
    return s <= 1 ? '#E53935' : s === 2 ? '#FB8C00' : s === 3 ? '#FDD835' : '#43A047';
  }
  pwdStrengthLabel(): string {
    const s = this.pwdStrength();
    return s <= 1 ? 'Faible' : s === 2 ? 'Moyen' : s === 3 ? 'Bon' : 'Tres fort';
  }

  ngOnDestroy() { this.stopCamera(); }

  async startCamera(isReg = false) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width:640, height:480 } });
      if (isReg) {
        this.regStream = stream;
        setTimeout(() => {
          if (this.regVideoEl?.nativeElement) {
            this.regVideoEl.nativeElement.srcObject = stream;
            this.regCameraActive.set(true);
          }
        }, 300);
      } else {
        this.stream = stream;
        setTimeout(() => {
          if (this.videoEl?.nativeElement) {
            this.videoEl.nativeElement.srcObject = stream;
            this.cameraActive.set(true);
            setTimeout(() => this.scanFaceAuto(), 2000);
          }
        }, 300);
      }
    } catch { this.error.set('Camera inaccessible.'); }
  }

  stopCamera() {
    if (this.scanTimer) { clearTimeout(this.scanTimer); this.scanTimer = null; }
    this.stream?.getTracks().forEach(t => t.stop());
    this.regStream?.getTracks().forEach(t => t.stop());
    this.stream = null; this.regStream = null;
    this.cameraActive.set(false);
  }

  captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string {
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d')!.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL('image/jpeg', 0.5);
  }

  setLoginMode(mode: LoginMode) {
    this.loginMode.set(mode);
    this.error.set(null);
    if (mode === 'face') setTimeout(() => this.startCamera(), 200);
    else this.stopCamera();
  }

  submitLogin() {
    if (!this.email || !this.password) return;
    this.loading.set(true); this.error.set(null);
    this.auth.login(this.email.trim(), this.password).subscribe({
      error: () => this.loading.set(false)
    });
  }

  // ── LOGIN FACIAL AUTO ─────────────────────────────────────
  scanFaceAuto() {
    // ANNULER LE TIMER DES LE DEBUT — empêche le retry d'interférer
    if (this.scanTimer) { clearTimeout(this.scanTimer); this.scanTimer = null; }
    if (!this.cameraActive() || !this.videoEl?.nativeElement) return;
    this.loading.set(true); this.error.set(null); this.faceResult.set(null);
    const image = this.captureFrame(this.videoEl.nativeElement, this.canvasEl.nativeElement);
    this.http.post<any>(`${BASE}/auth/scan-face`, { image }).subscribe({
      next: res => {
        if (this.scanTimer) { clearTimeout(this.scanTimer); this.scanTimer = null; }
        this.faceResult.set({ verified: true, similarity: res.similarity });
        this.loading.set(false);
        this.stopCamera();
        // Sauvegarder token ET user AVANT navigation pour éviter redirect login
        localStorage.setItem('hs_token', res.token);
        this.auth.token.set(res.token);
        this.auth.currentUser.set(res.user);
        // Attendre un tick Angular pour que les signals soient propagés
        setTimeout(() => {
          if (res.user.role === 'directeur') {
            this.router.navigate(['/']);
          } else {
            const hId = res.user.hospital_id;
            const sId = res.user.service_id;
            if (hId && sId) this.router.navigate(['/hospitals', hId, 'services', sId]);
            else this.router.navigate(['/']);
          }
        }, 100);
      },
      error: err => {
        const data = err.error || {};
        this.faceResult.set({ verified: false, similarity: data.similarity ?? 0 });
        this.error.set(data.message || 'Visage non reconnu.');
        this.loading.set(false);
        // Retry après 4 secondes
        this.scanTimer = setTimeout(() => {
          this.scanTimer = null;
          if (this.loginMode() === 'face' && this.cameraActive() && !this.loading()) {
            this.faceResult.set(null);
            this.error.set(null);
            this.scanFaceAuto();
          }
        }, 4000);
      }
    });
  }

  captureFaceLogin() { this.scanFaceAuto(); }

  goRegister() {
    this.page.set('register'); this.regStep.set('info');
    this.error.set(null); this.success.set(null);
    this.loadHospitals(); this.stopCamera();
  }

  backToLogin() {
    this.page.set('login');
    this.error.set(null); this.success.set(null);
    this.stopCamera();
  }

  loadServices(hospitalId: number|null) {
    this.services.set([]);
    this.reg.service_id = null;
    if (!hospitalId) return;
    // Charger uniquement les services LIBRES (sans chef assigné)
    this.http.get<any[]>(`${BASE}/auth/free-services?hospital_id=${hospitalId}`).subscribe({
      next: s => this.services.set(s), error: () => {}
    });
  }

  loadHospitals() {
    if (this.hospitals().length > 0) return;
    this.http.get<any[]>(`${BASE}/auth/hospitals`).subscribe({
      next: h => this.hospitals.set(h), error: () => {}
    });
  }

  sendEmailVerification() {
    if (!this.reg.email) { this.error.set('Entrez votre email.'); return; }
    this.loading.set(true); this.error.set(null);
    this.http.post<any>(`${BASE}/auth/send-verification`, { email: this.reg.email }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.dev_otp) this.success.set(`Code de dev : ${res.dev_otp}`);
        else this.success.set('Code envoye sur ' + this.reg.email);
        this.regStep.set('verify');
      },
      error: err => { this.loading.set(false); this.error.set(err.error?.message || 'Erreur envoi.'); }
    });
  }

  verifyEmailOtp() {
    this.loading.set(true); this.error.set(null);
    this.http.post<any>(`${BASE}/auth/verify-email`, { email: this.reg.email, otp: this.reg.otp }).subscribe({
      next: () => { this.loading.set(false); this.success.set(null); this.error.set(null); this.regStep.set('password'); },
      error: err => { this.loading.set(false); this.error.set(err.error?.message || 'Code incorrect.'); }
    });
  }

  goToPhone() {
    if (this.reg.password !== this.reg.confirmPassword) { this.error.set('Les mots de passe ne correspondent pas.'); return; }
    this.error.set(null); this.regStep.set('phone');
  }

  async startRegCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.regStream = stream;
      setTimeout(() => {
        if (this.regVideoEl?.nativeElement) {
          this.regVideoEl.nativeElement.srcObject = stream;
          this.regCameraActive.set(true);
        }
      }, 300);
    } catch { }
  }

  captureRegFace() {
    if (!this.regVideoEl?.nativeElement || !this.regCameraActive()) { this.startRegCamera(); return; }
    this.regFaceImage = this.captureFrame(this.regVideoEl.nativeElement, this.regCanvasEl.nativeElement);
    this.regFaceCaptured.set(true);
  }

  submitRegister() {
    this.loading.set(true); this.error.set(null);
    this.http.post<any>(`${BASE}/auth/register`, {
      nom: this.reg.nom, prenom: this.reg.prenom,
      email: this.reg.email, password: this.reg.password,
      phone: this.reg.phone || null, hospital_id: this.reg.hospital_id,
      service_id: this.reg.service_id,
      face_image: this.regFaceImage || null,
    }).subscribe({
      next: () => { this.loading.set(false); this.regStep.set('done'); },
      error: err => { this.loading.set(false); this.error.set(err.error?.message || 'Erreur creation compte.'); }
    });
  }

  goForgot() { this.page.set('forgot'); this.error.set(null); this.success.set(null); }

  submitForgot() {
    if (!this.forgotEmail) return;
    this.loading.set(true); this.error.set(null); this.success.set(null);
    this.http.post<any>(`${BASE}/auth/forgot-password`, { email: this.forgotEmail, method: this.forgotMethod(), phone: this.forgotPhone || null }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.dev_otp) {
          this.success.set(`Code de demonstration : ${res.dev_otp}`);
          setTimeout(() => this.page.set('otp'), 5000);
        } else {
          this.success.set(res.message);
          setTimeout(() => this.page.set('otp'), 2000);
        }
      },
      error: err => {
        this.loading.set(false);
        const data = err.error || {};
        if (data.dev_otp) {
          // SMS echoue mais code disponible pour demo
          this.success.set(`Code de demonstration : ${data.dev_otp}`);
          setTimeout(() => this.page.set('otp'), 5000);
        } else {
          this.error.set(data.message || 'Erreur.');
        }
      }
    });
  }

  submitOtp() {
    if (!this.otp.code || !this.otp.newPassword || this.otp.newPassword !== this.otp.confirmPassword) return;
    this.loading.set(true); this.error.set(null);
    this.http.post<any>(`${BASE}/auth/verify-otp`, {
      email: this.forgotEmail, otp: this.otp.code,
      new_password: this.otp.newPassword, confirm_password: this.otp.confirmPassword,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Mot de passe reinitialise avec succes !');
        setTimeout(() => { this.page.set('login'); this.error.set(null); this.success.set(null); }, 2000);
      },
      error: err => { this.loading.set(false); this.error.set(err.error?.message || 'Code incorrect.'); }
    });
  }
}