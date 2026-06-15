// src/app/pages/doctors/doctors.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/auth.service';

const BASE = 'http://localhost:8000/api';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background overflow-y-auto">

  <!-- HEADER -->
  <div class="px-6 py-5 border-b bg-card flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="stethoscope" class="w-5 h-5 text-white"></lucide-icon>
      </div>
      <div>
        <h1 class="text-xl font-bold text-foreground">Corps Médical</h1>
        <p class="text-xs text-muted-foreground">Médecins et infirmiers par service</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button *ngIf="auth.isDirecteur()" type="button" (click)="showForm.set(true)"
              class="px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Ajouter un médecin
      </button>
      <button *ngIf="auth.isDirecteur()" type="button" (click)="showNurseForm.set(true)"
              class="px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style="background:linear-gradient(135deg,#43A047,#2E7D32)">
        <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Ajouter un infirmier
      </button>
    </div>
  </div>

  <!-- ONGLETS -->
  <div class="bg-card border-b px-6 flex items-center gap-1">
    <button (click)="activeTab.set('doctors')"
            class="px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5"
            [style.borderColor]="activeTab()==='doctors'?'#00BCD4':'transparent'"
            [style.color]="activeTab()==='doctors'?'#00BCD4':'var(--muted-foreground)'">
      <lucide-icon name="stethoscope" class="w-3.5 h-3.5"></lucide-icon>Médecins ({{ doctors().length }})
    </button>
    <button (click)="activeTab.set('nurses')"
            class="px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5"
            [style.borderColor]="activeTab()==='nurses'?'#43A047':'transparent'"
            [style.color]="activeTab()==='nurses'?'#43A047':'var(--muted-foreground)'">
      <lucide-icon name="heart-pulse" class="w-3.5 h-3.5"></lucide-icon>Infirmiers ({{ nurses().length }})
    </button>
  </div>

  <div class="flex-1 p-5 max-w-5xl mx-auto w-full space-y-5">

    <!-- MESSAGE -->
    <div *ngIf="msg()" class="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
         [style.background]="msgType()==='ok'?'#43A04715':'#E5393515'"
         [style.color]="msgType()==='ok'?'#43A047':'#E53935'">
      <lucide-icon [name]="msgType()==='ok'?'check-circle':'alert-circle'" class="w-4 h-4"></lucide-icon>
      {{ msg() }}
    </div>

    <!-- ══════════ ONGLET MÉDECINS ══════════ -->
    <ng-container *ngIf="activeTab()==='doctors'">

      <!-- STATS -->
      <div *ngIf="stats()" class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-card rounded-2xl border border-border p-4 text-center">
          <div class="text-2xl font-bold text-foreground">{{ stats().total }}</div>
          <div class="text-xs text-muted-foreground mt-1">Total médecins</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#43A04730">
          <div class="text-2xl font-bold" style="color:#43A047">{{ stats().disponibles }}</div>
          <div class="text-xs text-muted-foreground mt-1">Disponibles</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#FB8C0030">
          <div class="text-2xl font-bold" style="color:#FB8C00">{{ stats().en_garde }}</div>
          <div class="text-xs text-muted-foreground mt-1">En garde</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#E5393530">
          <div class="text-2xl font-bold" style="color:#E53935">{{ stats().en_conge + stats().absents }}</div>
          <div class="text-xs text-muted-foreground mt-1">Absents / Congé</div>
        </div>
      </div>

      <!-- FILTRES -->
      <div class="flex gap-3 flex-wrap">
        <select *ngIf="auth.isDirecteur()" [(ngModel)]="filterService" (ngModelChange)="applyFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les services</option>
          <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
        </select>
        <select [(ngModel)]="filterStatut" (ngModelChange)="applyFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les statuts</option>
          <option value="disponible">Disponible</option>
          <option value="en_garde">En garde</option>
          <option value="en_conge">En congé</option>
          <option value="absent">Absent</option>
          <option value="en_formation">En formation</option>
        </select>
        <select [(ngModel)]="filterGrade" (ngModelChange)="applyFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les grades</option>
          <option value="interne">Interne</option>
          <option value="resident">Résident</option>
          <option value="specialiste">Spécialiste</option>
          <option value="maitre_assistant">Maître Assistant</option>
          <option value="professeur">Professeur</option>
        </select>
        <div class="ml-auto text-xs text-muted-foreground self-center">{{ filtered().length }} médecin(s)</div>
      </div>

      <!-- LISTE MÉDECINS -->
      <div *ngIf="loading()" class="text-center py-10 text-sm text-muted-foreground">Chargement...</div>
      <div *ngIf="!loading() && filtered().length === 0"
           class="bg-card rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        <lucide-icon name="stethoscope" class="w-10 h-10 mx-auto mb-3 opacity-20"></lucide-icon>
        <p>Aucun médecin enregistré.</p>
        <p *ngIf="auth.isDirecteur()" class="mt-1">Cliquez sur "Ajouter un médecin" pour commencer.</p>
      </div>
      <div class="space-y-3">
        <div *ngFor="let d of filtered()" class="bg-card rounded-2xl border border-border p-4 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
               [style.background]="gradeColor(d.grade)">{{ gradeInitial(d.grade) }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-sm font-bold text-foreground">{{ d.nom_complet }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" [style.background]="gradeColor(d.grade)+'20'" [style.color]="gradeColor(d.grade)">{{ d.grade_label }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" [style.background]="statutColor(d.statut)+'20'" [style.color]="statutColor(d.statut)">{{ d.statut_label }}</span>
            </div>
            <div class="text-xs text-muted-foreground mb-2">{{ d.specialite }}</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ d.nb_patients_charge }}</div><div class="text-[10px] text-muted-foreground">Patients</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ d.heures_travail_effectuees }}h</div><div class="text-[10px] text-muted-foreground">Heures/mois</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ d.nb_gardes_mois }}</div><div class="text-[10px] text-muted-foreground">Gardes/mois</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold" [style.color]="d.taux_travail_pct>90?'#E53935':d.taux_travail_pct>70?'#FB8C00':'#43A047'">{{ d.taux_travail_pct }}%</div><div class="text-[10px] text-muted-foreground">Charge</div></div>
            </div>
            <div class="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all" [style.width.%]="d.taux_travail_pct" [style.background]="d.taux_travail_pct>90?'#E53935':d.taux_travail_pct>70?'#FB8C00':'#43A047'"></div>
            </div>
            <div class="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span *ngIf="d.telephone" class="flex items-center gap-1"><lucide-icon name="phone" class="w-3 h-3"></lucide-icon>{{ d.telephone }}</span>
              <span *ngIf="d.email" class="flex items-center gap-1"><lucide-icon name="mail" class="w-3 h-3"></lucide-icon>{{ d.email }}</span>
            </div>
          </div>
          <div *ngIf="auth.isDirecteur()" class="flex gap-2 flex-shrink-0">
            <button type="button" (click)="editDoctor(d)" class="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"><lucide-icon name="pencil" class="w-4 h-4"></lucide-icon></button>
            <button type="button" (click)="deleteDoctor(d.id)" class="p-2 rounded-lg border border-border hover:bg-red-50 text-muted-foreground hover:text-red-500"><lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon></button>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ══════════ ONGLET INFIRMIERS ══════════ -->
    <ng-container *ngIf="activeTab()==='nurses'">

      <!-- STATS INFIRMIERS -->
      <div *ngIf="nurseStats()" class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-card rounded-2xl border border-border p-4 text-center">
          <div class="text-2xl font-bold text-foreground">{{ nurseStats().total }}</div>
          <div class="text-xs text-muted-foreground mt-1">Total infirmiers</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#43A04730">
          <div class="text-2xl font-bold" style="color:#43A047">{{ nurseStats().disponibles }}</div>
          <div class="text-xs text-muted-foreground mt-1">Disponibles</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#FB8C0030">
          <div class="text-2xl font-bold" style="color:#FB8C00">{{ nurseStats().en_garde }}</div>
          <div class="text-xs text-muted-foreground mt-1">En garde</div>
        </div>
        <div class="bg-card rounded-2xl border p-4 text-center" style="border-color:#E5393530">
          <div class="text-2xl font-bold" style="color:#E53935">{{ nurseStats().en_conge + nurseStats().absents }}</div>
          <div class="text-xs text-muted-foreground mt-1">Absents / Congé</div>
        </div>
      </div>

      <!-- FILTRES INFIRMIERS -->
      <div class="flex gap-3 flex-wrap">
        <select *ngIf="auth.isDirecteur()" [(ngModel)]="filterNurseService" (ngModelChange)="applyNurseFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les services</option>
          <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
        </select>
        <select [(ngModel)]="filterNurseStatut" (ngModelChange)="applyNurseFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les statuts</option>
          <option value="disponible">Disponible</option>
          <option value="en_garde">En garde</option>
          <option value="en_conge">En congé</option>
          <option value="absent">Absent</option>
          <option value="en_formation">En formation</option>
        </select>
        <select [(ngModel)]="filterNurseGrade" (ngModelChange)="applyNurseFilter()"
                class="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">Tous les grades</option>
          <option value="infirmier">Infirmier</option>
          <option value="infirmier_chef">Infirmier Chef</option>
          <option value="infirmier_specialise">Infirmier Spécialisé</option>
        </select>
        <div class="ml-auto text-xs text-muted-foreground self-center">{{ filteredNurses().length }} infirmier(s)</div>
      </div>

      <!-- LISTE INFIRMIERS -->
      <div *ngIf="loadingNurses()" class="text-center py-10 text-sm text-muted-foreground">Chargement...</div>
      <div *ngIf="!loadingNurses() && filteredNurses().length === 0"
           class="bg-card rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        <lucide-icon name="heart-pulse" class="w-10 h-10 mx-auto mb-3 opacity-20"></lucide-icon>
        <p>Aucun infirmier enregistré.</p>
        <p *ngIf="auth.isDirecteur()" class="mt-1">Cliquez sur "Ajouter un infirmier" pour commencer.</p>
      </div>
      <div class="space-y-3">
        <div *ngFor="let n of filteredNurses()" class="bg-card rounded-2xl border border-border p-4 flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
               [style.background]="nurseGradeColor(n.grade)">{{ nurseGradeInitial(n.grade) }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-sm font-bold text-foreground">{{ n.nom_complet }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" [style.background]="nurseGradeColor(n.grade)+'20'" [style.color]="nurseGradeColor(n.grade)">{{ n.grade_label }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" [style.background]="statutColor(n.statut)+'20'" [style.color]="statutColor(n.statut)">{{ n.statut_label }}</span>
            </div>
            <div class="text-xs text-muted-foreground mb-2">{{ n.specialite || 'Soins généraux' }}</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ n.nb_patients_charge }}</div><div class="text-[10px] text-muted-foreground">Patients</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ n.heures_travail_effectuees }}h</div><div class="text-[10px] text-muted-foreground">Heures/mois</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold text-foreground">{{ n.nb_gardes_mois }}</div><div class="text-[10px] text-muted-foreground">Gardes/mois</div></div>
              <div class="bg-muted/30 rounded-lg p-2 text-center"><div class="text-sm font-bold" [style.color]="n.taux_travail_pct>90?'#E53935':n.taux_travail_pct>70?'#FB8C00':'#43A047'">{{ n.taux_travail_pct }}%</div><div class="text-[10px] text-muted-foreground">Charge</div></div>
            </div>
            <div class="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all" [style.width.%]="n.taux_travail_pct" [style.background]="n.taux_travail_pct>90?'#E53935':n.taux_travail_pct>70?'#FB8C00':'#43A047'"></div>
            </div>
            <div class="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span *ngIf="n.telephone" class="flex items-center gap-1"><lucide-icon name="phone" class="w-3 h-3"></lucide-icon>{{ n.telephone }}</span>
              <span *ngIf="n.email" class="flex items-center gap-1"><lucide-icon name="mail" class="w-3 h-3"></lucide-icon>{{ n.email }}</span>
            </div>
          </div>
          <div *ngIf="auth.isDirecteur()" class="flex gap-2 flex-shrink-0">
            <button type="button" (click)="editNurse(n)" class="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"><lucide-icon name="pencil" class="w-4 h-4"></lucide-icon></button>
            <button type="button" (click)="deleteNurse(n.id)" class="p-2 rounded-lg border border-border hover:bg-red-50 text-muted-foreground hover:text-red-500"><lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon></button>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- FORMULAIRE AJOUT/EDIT MÉDECIN -->
    <div *ngIf="showForm()" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)">
      <div class="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-foreground text-lg">{{ editingId() ? 'Modifier le médecin' : 'Ajouter un médecin' }}</h2>
          <button type="button" (click)="closeForm()" class="p-2 rounded-lg hover:bg-muted">
            <lucide-icon name="x" class="w-4 h-4 text-foreground"></lucide-icon>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Prénom *</label>
            <input [(ngModel)]="form.prenom" type="text" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Nom *</label>
            <input [(ngModel)]="form.nom" type="text" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Service *</label>
            <select [(ngModel)]="form.service_id" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option [ngValue]="null">— Choisir —</option>
              <option *ngFor="let s of services()" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Spécialité *</label>
            <input [(ngModel)]="form.specialite" type="text" placeholder="Ex: Cardiologie"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Grade *</label>
            <select [(ngModel)]="form.grade" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option value="interne">Interne</option>
              <option value="resident">Résident</option>
              <option value="specialiste">Spécialiste</option>
              <option value="maitre_assistant">Maître Assistant</option>
              <option value="professeur">Professeur</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Statut</label>
            <select [(ngModel)]="form.statut" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option value="disponible">Disponible</option>
              <option value="en_garde">En garde</option>
              <option value="en_conge">En congé</option>
              <option value="absent">Absent</option>
              <option value="en_formation">En formation</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Téléphone</label>
            <input [(ngModel)]="form.telephone" type="tel" placeholder="+213 555 123 456"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Email</label>
            <input [(ngModel)]="form.email" type="email"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Heures/semaine contractuelles</label>
            <input [(ngModel)]="form.heures_travail_semaine" type="number" min="1" max="84"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Heures effectuées ce mois</label>
            <input [(ngModel)]="form.heures_travail_effectuees" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Patients en charge</label>
            <input [(ngModel)]="form.nb_patients_charge" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Gardes ce mois</label>
            <input [(ngModel)]="form.nb_gardes_mois" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Date de recrutement</label>
            <input [(ngModel)]="form.date_recrutement" type="date"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Notes</label>
            <input [(ngModel)]="form.notes" type="text" placeholder="Notes optionnelles..."
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" (click)="closeForm()" class="flex-1 py-2.5 rounded-xl border border-border text-sm text-foreground">Annuler</button>
          <button type="button" (click)="saveDoctor()"
                  [disabled]="saving() || !form.nom || !form.prenom || !form.service_id || !form.specialite"
                  class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="saving()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="saving()"></lucide-icon>
            {{ editingId() ? 'Mettre à jour' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- FORMULAIRE AJOUT/EDIT INFIRMIER -->
    <div *ngIf="showNurseForm()" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)">
      <div class="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-foreground text-lg">{{ editingNurseId() ? 'Modifier l\'infirmier' : 'Ajouter un infirmier' }}</h2>
          <button type="button" (click)="closeNurseForm()" class="p-2 rounded-lg hover:bg-muted">
            <lucide-icon name="x" class="w-4 h-4 text-foreground"></lucide-icon>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Prénom *</label>
            <input [(ngModel)]="nurseForm.prenom" type="text" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Nom *</label>
            <input [(ngModel)]="nurseForm.nom" type="text" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Service *</label>
            <select [(ngModel)]="nurseForm.service_id" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option [ngValue]="null">— Choisir —</option>
              <option *ngFor="let s of services()" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Spécialité</label>
            <input [(ngModel)]="nurseForm.specialite" type="text" placeholder="Ex: Soins intensifs"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Grade *</label>
            <select [(ngModel)]="nurseForm.grade" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option value="infirmier">Infirmier</option>
              <option value="infirmier_chef">Infirmier Chef</option>
              <option value="infirmier_specialise">Infirmier Spécialisé</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Statut</label>
            <select [(ngModel)]="nurseForm.statut" class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
              <option value="disponible">Disponible</option>
              <option value="en_garde">En garde</option>
              <option value="en_conge">En congé</option>
              <option value="absent">Absent</option>
              <option value="en_formation">En formation</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Téléphone</label>
            <input [(ngModel)]="nurseForm.telephone" type="tel" placeholder="+213 555 123 456"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Email</label>
            <input [(ngModel)]="nurseForm.email" type="email"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Heures/semaine contractuelles</label>
            <input [(ngModel)]="nurseForm.heures_travail_semaine" type="number" min="1" max="84"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Heures effectuées ce mois</label>
            <input [(ngModel)]="nurseForm.heures_travail_effectuees" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Patients en charge</label>
            <input [(ngModel)]="nurseForm.nb_patients_charge" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Gardes ce mois</label>
            <input [(ngModel)]="nurseForm.nb_gardes_mois" type="number" min="0"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Date de recrutement</label>
            <input [(ngModel)]="nurseForm.date_recrutement" type="date"
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Notes</label>
            <input [(ngModel)]="nurseForm.notes" type="text" placeholder="Notes optionnelles..."
                   class="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none"/>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" (click)="closeNurseForm()" class="flex-1 py-2.5 rounded-xl border border-border text-sm text-foreground">Annuler</button>
          <button type="button" (click)="saveNurse()"
                  [disabled]="saving() || !nurseForm.nom || !nurseForm.prenom || !nurseForm.service_id"
                  class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  style="background:linear-gradient(135deg,#43A047,#2E7D32)">
            <lucide-icon [name]="saving()?'loader-2':'check-circle'" class="w-4 h-4" [class.animate-spin]="saving()"></lucide-icon>
            {{ editingNurseId() ? 'Mettre à jour' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
})
export class DoctorsComponent implements OnInit {
  auth    = inject(AuthService);
  private http = inject(HttpClient);

  loading        = signal(true);
  saving         = signal(false);
  showForm       = signal(false);
  editingId      = signal<number|null>(null);
  showNurseForm  = signal(false);
  editingNurseId = signal<number|null>(null);
  activeTab      = signal<'doctors'|'nurses'>('doctors');
  msg            = signal<string|null>(null);
  msgType        = signal<'ok'|'err'>('ok');

  doctors        = signal<any[]>([]);
  filtered       = signal<any[]>([]);
  stats          = signal<any>(null);
  services       = signal<any[]>([]);
  nurses         = signal<any[]>([]);
  filteredNurses = signal<any[]>([]);
  nurseStats     = signal<any>(null);
  loadingNurses  = signal(false);

  filterService      = '';
  filterStatut       = '';
  filterGrade        = '';
  filterNurseService = '';
  filterNurseStatut  = '';
  filterNurseGrade   = '';

  form      = this.emptyForm();
  nurseForm = this.emptyNurseForm();

  emptyForm() {
    return {
      service_id:                null as number|null,
      nom:                       '',
      prenom:                    '',
      email:                     '',
      telephone:                 '',
      specialite:                '',
      grade:                     'specialiste',
      statut:                    'disponible',
      heures_travail_semaine:    40,
      heures_travail_effectuees: 0,
      nb_patients_charge:        0,
      nb_gardes_mois:            0,
      date_recrutement:          '',
      notes:                     '',
    };
  }

  emptyNurseForm() {
    return {
      service_id:                null as number|null,
      nom:                       '',
      prenom:                    '',
      email:                     '',
      telephone:                 '',
      specialite:                '',
      grade:                     'infirmier',
      statut:                    'disponible',
      heures_travail_semaine:    40,
      heures_travail_effectuees: 0,
      nb_patients_charge:        0,
      nb_gardes_mois:            0,
      date_recrutement:          '',
      notes:                     '',
    };
  }

  ngOnInit() {
    this.loadServices();
    this.loadDoctors();
    this.loadNurses();
  }

  loadServices() {
    const hId = this.auth.currentUser()?.hospital_id;
    if (!hId) return;
    this.http.get<any[]>(`${BASE}/hospitals/${hId}/services`).subscribe({
      next: s => this.services.set(s), error: () => {}
    });
  }

  loadDoctors() {
    this.loading.set(true);
    const serviceId = this.auth.isChefService() ? this.auth.userServiceId() : null;
    const url = serviceId ? `${BASE}/doctors?service_id=${serviceId}` : `${BASE}/doctors`;
    this.http.get<any>(url).subscribe({
      next: res => {
        this.doctors.set(res.doctors || []);
        this.stats.set(res.stats || null);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    let list = this.doctors();
    if (this.filterService) {
      list = list.filter(d => d.service_id === +this.filterService);
    }
    if (this.filterStatut) {
      list = list.filter(d => d.statut === this.filterStatut);
    }
    if (this.filterGrade) {
      list = list.filter(d => d.grade === this.filterGrade);
    }
    this.filtered.set(list);
  }

  editDoctor(d: any) {
    this.editingId.set(d.id);
    this.form = {
      service_id:                d.service_id,
      nom:                       d.nom,
      prenom:                    d.prenom,
      email:                     d.email || '',
      telephone:                 d.telephone || '',
      specialite:                d.specialite,
      grade:                     d.grade,
      statut:                    d.statut,
      heures_travail_semaine:    d.heures_travail_semaine,
      heures_travail_effectuees: d.heures_travail_effectuees,
      nb_patients_charge:        d.nb_patients_charge,
      nb_gardes_mois:            d.nb_gardes_mois,
      date_recrutement:          d.date_recrutement || '',
      notes:                     d.notes || '',
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.emptyForm();
  }

  saveDoctor() {
    if (!this.form.nom || !this.form.prenom || !this.form.service_id || !this.form.specialite) return;
    this.saving.set(true);

    const req = this.editingId()
      ? this.http.put<any>(`${BASE}/doctors/${this.editingId()}`, this.form)
      : this.http.post<any>(`${BASE}/doctors`, this.form);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showMsg(this.editingId() ? 'Médecin mis à jour !' : 'Médecin ajouté !', 'ok');
        this.closeForm();
        this.loadDoctors();
      },
      error: err => {
        this.saving.set(false);
        this.showMsg(err.error?.message || 'Erreur.', 'err');
      }
    });
  }

  deleteDoctor(id: number) {
    if (!confirm('Supprimer ce médecin ?')) return;
    this.http.delete<any>(`${BASE}/doctors/${id}`).subscribe({
      next: () => { this.showMsg('Médecin supprimé.', 'ok'); this.loadDoctors(); },
      error: err => this.showMsg(err.error?.message || 'Erreur.', 'err'),
    });
  }

  loadNurses() {
    this.loadingNurses.set(true);
    const serviceId = this.auth.isChefService() ? this.auth.userServiceId() : null;
    const url = serviceId ? `${BASE}/nurses?service_id=${serviceId}` : `${BASE}/nurses`;
    this.http.get<any>(url).subscribe({
      next: res => {
        this.nurses.set(res.nurses || []);
        this.nurseStats.set(res.stats || null);
        this.applyNurseFilter();
        this.loadingNurses.set(false);
      },
      error: () => this.loadingNurses.set(false),
    });
  }

  applyNurseFilter() {
    let list = this.nurses();
    if (this.filterNurseService) list = list.filter(n => n.service_id === +this.filterNurseService);
    if (this.filterNurseStatut)  list = list.filter(n => n.statut === this.filterNurseStatut);
    if (this.filterNurseGrade)   list = list.filter(n => n.grade === this.filterNurseGrade);
    this.filteredNurses.set(list);
  }

  editNurse(n: any) {
    this.editingNurseId.set(n.id);
    this.nurseForm = {
      service_id:                n.service_id,
      nom:                       n.nom,
      prenom:                    n.prenom,
      email:                     n.email || '',
      telephone:                 n.telephone || '',
      specialite:                n.specialite || '',
      grade:                     n.grade,
      statut:                    n.statut,
      heures_travail_semaine:    n.heures_travail_semaine,
      heures_travail_effectuees: n.heures_travail_effectuees,
      nb_patients_charge:        n.nb_patients_charge,
      nb_gardes_mois:            n.nb_gardes_mois,
      date_recrutement:          n.date_recrutement || '',
      notes:                     n.notes || '',
    };
    this.showNurseForm.set(true);
  }

  closeNurseForm() {
    this.showNurseForm.set(false);
    this.editingNurseId.set(null);
    this.nurseForm = this.emptyNurseForm();
  }

  saveNurse() {
    if (!this.nurseForm.nom || !this.nurseForm.prenom || !this.nurseForm.service_id) return;
    this.saving.set(true);
    const req = this.editingNurseId()
      ? this.http.put<any>(`${BASE}/nurses/${this.editingNurseId()}`, this.nurseForm)
      : this.http.post<any>(`${BASE}/nurses`, this.nurseForm);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showMsg(this.editingNurseId() ? 'Infirmier mis à jour !' : 'Infirmier ajouté !', 'ok');
        this.closeNurseForm();
        this.loadNurses();
      },
      error: err => {
        this.saving.set(false);
        this.showMsg(err.error?.message || 'Erreur.', 'err');
      },
    });
  }

  deleteNurse(id: number) {
    if (!confirm('Supprimer cet infirmier ?')) return;
    this.http.delete<any>(`${BASE}/nurses/${id}`).subscribe({
      next: () => { this.showMsg('Infirmier supprimé.', 'ok'); this.loadNurses(); },
      error: err => this.showMsg(err.error?.message || 'Erreur.', 'err'),
    });
  }

  showMsg(text: string, type: 'ok'|'err') {
    this.msg.set(text); this.msgType.set(type);
    setTimeout(() => this.msg.set(null), 4000);
  }

  gradeColor(grade: string): string {
    const colors: Record<string, string> = {
      interne: '#9C27B0', resident: '#00BCD4', specialiste: '#43A047',
      maitre_assistant: '#FB8C00', professeur: '#E53935',
    };
    return colors[grade] ?? '#607D8B';
  }

  gradeInitial(grade: string): string {
    const map: Record<string, string> = {
      interne: 'INT', resident: 'RES', specialiste: 'SPE',
      maitre_assistant: 'MA', professeur: 'PR',
    };
    return map[grade] ?? 'DR';
  }

  statutColor(statut: string): string {
    const colors: Record<string, string> = {
      disponible: '#43A047', en_garde: '#FB8C00', en_conge: '#00BCD4',
      absent: '#E53935', en_formation: '#9C27B0',
    };
    return colors[statut] ?? '#607D8B';
  }

  nurseGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      infirmier: '#43A047', infirmier_chef: '#FB8C00', infirmier_specialise: '#0288D1',
    };
    return colors[grade] ?? '#607D8B';
  }

  nurseGradeInitial(grade: string): string {
    const map: Record<string, string> = {
      infirmier: 'INF', infirmier_chef: 'IC', infirmier_specialise: 'IS',
    };
    return map[grade] ?? 'INF';
  }
}
