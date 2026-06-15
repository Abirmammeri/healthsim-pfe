import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { Service } from '../../shared/models';

const BASE = 'http://localhost:8000/api';
const PRIMARY = '#00BCD4'; const PRIMARY_DARK = '#0288D1';
const GREEN = '#43A047'; const ORANGE = '#FB8C00'; const RED = '#E53935';
const PURPLE = '#9C27B0';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="flex flex-col h-full bg-background">

  <!-- HEADER -->
  <div class="px-6 py-4 bg-card border-b flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <button (click)="back()" class="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
        <lucide-icon name="arrow-left" class="w-4 h-4 text-foreground"></lucide-icon>
      </button>
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="layout-grid" class="w-5 h-5 text-white"></lucide-icon>
      </div>
      <div>
        <h1 class="text-lg font-bold text-foreground">{{ service()?.name }}</h1>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <lucide-icon name="users" class="w-3 h-3"></lucide-icon>
          <span>Dr. {{ service()?.head }}</span>
          <span class="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
          <span>{{ service()?.type }}</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3 flex-wrap">
      <span *ngIf="service() as svc" class="text-xs font-bold px-3 py-1.5 rounded-full"
            [style.backgroundColor]="statusColor(svc.status)+'18'"
            [style.color]="statusColor(svc.status)">
        {{ statusLabel(svc.status) }}
      </span>
      <div *ngIf="service() as svc" class="flex items-center gap-3 text-xs bg-muted/50 rounded-xl px-3 py-1.5">
        <span class="flex items-center gap-1 text-muted-foreground">
          <lucide-icon name="stethoscope" class="w-3 h-3"></lucide-icon>
          <b class="text-foreground">{{ svc.doctors }}</b> méd.
        </span>
        <span class="w-px h-3 bg-border"></span>
        <span class="flex items-center gap-1 text-muted-foreground">
          <lucide-icon name="users" class="w-3 h-3"></lucide-icon>
          <b class="text-foreground">{{ svc.nurses }}</b> inf.
        </span>
        <span class="w-px h-3 bg-border"></span>
        <span class="flex items-center gap-1 text-muted-foreground">
          <lucide-icon name="heart-pulse" class="w-3 h-3"></lucide-icon>
          <b class="text-foreground">{{ svc.patients }}</b> pat.
        </span>
        <span class="w-px h-3 bg-border"></span>
        <span class="flex items-center gap-1 text-muted-foreground">
          <lucide-icon name="bed" class="w-3 h-3"></lucide-icon>
          <b [style.color]="((svc.beds - svc.patients) <= 2) ? RED : GREEN">
            {{ (svc.beds - svc.patients) > 0 ? (svc.beds - svc.patients) : 0 }}
          </b>/{{ svc.beds }} lits
        </span>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-5">
  <div *ngIf="loading()" class="flex items-center justify-center h-40 text-sm text-muted-foreground">Chargement…</div>

  <div *ngIf="!loading() && service() as svc" class="max-w-4xl mx-auto space-y-5">

    <!-- BARRE OCCUPATION -->
    <div class="bg-card rounded-2xl border shadow-sm p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <lucide-icon name="bed" class="w-4 h-4" [style.color]="statusColor(svc.status)"></lucide-icon>
          <span class="text-sm font-bold text-foreground">Occupation des lits</span>
        </div>
        <span class="text-2xl font-bold" [style.color]="statusColor(svc.status)">{{ loadPct(svc) }}%</span>
      </div>
      <div class="h-4 rounded-full bg-muted overflow-hidden mb-2">
        <div class="h-full rounded-full" [style.backgroundColor]="statusColor(svc.status)" [style.width.%]="loadPct(svc)"></div>
      </div>
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>{{ svc.patients }} patients · {{ (svc.beds - svc.patients) > 0 ? (svc.beds - svc.patients) : 0 }} lits disponibles</span>
        <span class="font-semibold" [style.color]="statusColor(svc.status)">
          {{ loadPct(svc)>=92?'Saturation critique':loadPct(svc)>=85?'Saturation — surveiller':loadPct(svc)>=70?'Attention — surveiller':'Fonctionnement normal' }}
        </span>
      </div>
    </div>

    <!-- VISUALISATION RESSOURCES DU SERVICE -->
    <div class="bg-card rounded-2xl border shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b flex items-center gap-2" style="background:linear-gradient(135deg,#00BCD408,#0288D108)">
        <lucide-icon name="activity" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
        <span class="text-sm font-bold text-foreground">Ressources actuelles du service</span>
        <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background:#00BCD415;color:#00BCD4">
          Données {{ isMedecineInterne(svc.name) ? 'réelles' : 'illustratives' }}
        </span>
      </div>

      <!-- Stats principales -->
      <div class="grid grid-cols-3 divide-x divide-border border-b">
        <div class="p-4 text-center">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:#00BCD415">
            <lucide-icon name="heart-pulse" class="w-5 h-5" style="color:#00BCD4"></lucide-icon>
          </div>
          <div class="text-2xl font-bold text-foreground">{{ svc.patients }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Patients hospitalisés</div>
          <div class="text-[10px] font-semibold mt-1" [style.color]="loadPct(svc) >= 85 ? RED : GREEN">
            {{ loadPct(svc) }}% occupation
          </div>
        </div>
        <div class="p-4 text-center">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:#43A04715">
            <lucide-icon name="stethoscope" class="w-5 h-5" style="color:#43A047"></lucide-icon>
          </div>
          <div class="text-2xl font-bold text-foreground">{{ svc.doctors }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Médecins</div>
          <div class="text-[10px] font-semibold mt-1" style="color:#43A047">
            {{ svc.doctors > 0 ? (svc.patients / svc.doctors | number:'1.0-1') : 0 }} pat./méd.
          </div>
        </div>
        <div class="p-4 text-center">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:#FB8C0015">
            <lucide-icon name="settings-2" class="w-5 h-5" style="color:#FB8C00"></lucide-icon>
          </div>
          <div class="text-2xl font-bold text-foreground">{{ equipmentList().length }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Types d'équipements</div>
          <div class="text-[10px] font-semibold mt-1" style="color:#FB8C00">
            {{ totalEquipQty() }} unités au total
          </div>
        </div>
      </div>

      <!-- Liste équipements -->
      <div class="p-4">
        <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <lucide-icon name="settings-2" class="w-3.5 h-3.5"></lucide-icon>
          Équipements médicaux — Taux d'utilisation journalier
        </div>

        <div *ngIf="equipmentList().length === 0" class="text-xs text-muted-foreground italic py-2">
          Aucun équipement enregistré pour ce service.
        </div>

        <div class="space-y-2">
          <div *ngFor="let eq of equipmentList()" class="rounded-xl border p-3"
               [style.borderColor]="eqTaux(eq) >= 80 ? '#E5393530' : eqTaux(eq) >= 50 ? '#FB8C0030' : '#43A04730'"
               [style.background]="eqTaux(eq) >= 80 ? '#E5393505' : eqTaux(eq) >= 50 ? '#FB8C0005' : '#43A04705'">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-2 h-2 rounded-full flex-shrink-0"
                     [style.backgroundColor]="isOperational(eq) ? GREEN : ORANGE"></div>
                <!-- ✅ CORRIGÉ : name || nom couvre les deux cas BDD -->
                <span class="text-xs font-semibold text-foreground truncate">{{ eqName(eq) }}</span>
                <span class="text-[10px] text-muted-foreground flex-shrink-0">× {{ eq.quantite ?? eq.quantity }}</span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span class="text-[10px] text-muted-foreground">{{ eq.patients_par_jour }} pat./jour</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      [style.backgroundColor]="eqTaux(eq) >= 80 ? '#E5393518' : eqTaux(eq) >= 50 ? '#FB8C0018' : '#43A04718'"
                      [style.color]="eqTaux(eq) >= 80 ? RED : eqTaux(eq) >= 50 ? ORANGE : GREEN">
                  {{ eqTaux(eq) | number:'1.0-0' }}%
                </span>
              </div>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all"
                   [style.backgroundColor]="eqTaux(eq) >= 80 ? RED : eqTaux(eq) >= 50 ? ORANGE : GREEN"
                   [style.width.%]="eqTaux(eq)"></div>
            </div>
            <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Durée moy. : {{ eq.duree_utilisation_min }}–{{ eq.duree_utilisation_max }} min/patient</span>
              <!-- ✅ CORRIGÉ : accepte 'operationnel' (français) et 'operational' (anglais) -->
              <span>{{ isOperational(eq) ? 'Opérationnel' : 'Maintenance' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 CATÉGORIES KPI -->
    <div>
      <div class="flex items-center gap-2 px-1 mb-4">
        <span class="w-1.5 h-4 rounded-full" style="background:#00BCD4"></span>
        <span class="text-xs font-bold text-foreground uppercase tracking-wider">Indicateurs de Performance — 4 Catégories</span>
        <span class="text-[10px] text-muted-foreground ml-1">Cliquer pour voir les KPIs détaillés</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <button (click)="goCategory('SSI')" class="bg-card rounded-2xl border-2 p-5 text-left hover:shadow-lg transition-all group" style="border-color:#00BCD440">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style="background:linear-gradient(135deg,#00BCD420,#0288D120)">
              <lucide-icon name="users" class="w-6 h-6" style="color:#00BCD4"></lucide-icon>
            </div>
            <div>
              <div class="text-sm font-bold text-foreground">A — Flux Patients</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color:#00BCD4">SSI</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">A2 Durée séjour</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">A4 Temps attente</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">A8 Lits vacants</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">A9 Transferts</span>
          </div>
          <div class="flex items-center justify-end gap-1 text-xs font-semibold" style="color:#00BCD4">
            Voir les KPIs <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
          </div>
        </button>

        <button (click)="goCategory('IIP')" class="bg-card rounded-2xl border-2 p-5 text-left hover:shadow-lg transition-all group" style="border-color:#E5393540">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style="background:linear-gradient(135deg,#E5393520,#FB8C0020)">
              <lucide-icon name="heart-pulse" class="w-6 h-6" style="color:#E53935"></lucide-icon>
            </div>
            <div>
              <div class="text-sm font-bold text-foreground">C — Qualité Clinique</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color:#E53935">IIP</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">C2 Occupation</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">C3 Mortalité</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">C4 Infections</span>
          </div>
          <div class="flex items-center justify-end gap-1 text-xs font-semibold" style="color:#E53935">
            Voir les KPIs <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
          </div>
        </button>

        <button (click)="goCategory('ESI')" class="bg-card rounded-2xl border-2 p-5 text-left hover:shadow-lg transition-all group" style="border-color:#43A04740">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style="background:linear-gradient(135deg,#43A04720,#2E7D3220)">
              <lucide-icon name="trending-up" class="w-6 h-6" style="color:#43A047"></lucide-icon>
            </div>
            <div>
              <div class="text-sm font-bold text-foreground">B — Finances</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color:#43A047">ESI</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">B1 Coût soins</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">B4 Coût/lit</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">B5 Médicaments</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">B7 Personnel</span>
          </div>
          <div class="flex items-center justify-end gap-1 text-xs font-semibold" style="color:#43A047">
            Voir les KPIs <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
          </div>
        </button>

        <button (click)="goCategory('TI')" class="bg-card rounded-2xl border-2 p-5 text-left hover:shadow-lg transition-all group" style="border-color:#FB8C0040">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style="background:linear-gradient(135deg,#FB8C0020,#F5720020)">
              <lucide-icon name="settings-2" class="w-6 h-6" style="color:#FB8C00"></lucide-icon>
            </div>
            <div>
              <div class="text-sm font-bold text-foreground">D — Infrastructure</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color:#FB8C00">TI</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">D5 Équipements</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">D11 DASRI</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">D12 Localisation</span>
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">D13 Air · D14 Son</span>
          </div>
          <div class="flex items-center justify-end gap-1 text-xs font-semibold" style="color:#FB8C00">
            Voir les KPIs <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
          </div>
        </button>
      </div>
    </div>

    <!-- CAS PARTICULIERS -->
    <div *ngIf="service() as svc"
         class="bg-card rounded-2xl border p-5"
         style="border-color:#9C27B030;background:#9C27B005">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#9C27B015">
            <lucide-icon name="activity" class="w-5 h-5" style="color:#9C27B0"></lucide-icon>
          </div>
          <div>
            <div class="text-sm font-bold text-foreground flex items-center gap-2">
              Patients — {{ getSpecialCaseName(svc.name) }}
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background:#9C27B015;color:#9C27B0">Exclus des KPI</span>
            </div>
            <div class="text-xs text-muted-foreground mt-0.5">
              Durée de séjour longue — non comptabilisés dans les indicateurs standards
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold" style="color:#9C27B0">{{ svcSpecialCase(svc) }}</div>
          <div class="text-xs text-muted-foreground">sur {{ svc.patients }} patients</div>
        </div>
      </div>
      <div class="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div class="h-full rounded-full" style="background:#9C27B0"
             [style.width.%]="svc.patients > 0 ? (svcSpecialCase(svc) / svc.patients * 100) : 0"></div>
      </div>
      <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ svc.patients - svcSpecialCase(svc) }} patients standards</span>
        <span class="font-semibold" style="color:#9C27B0">
          {{ svc.patients > 0 ? (svcSpecialCase(svc) / svc.patients * 100 | number:'1.0-0') : 0 }}% cas particuliers
        </span>
      </div>
      <div class="mt-4 pt-4 border-t border-border flex items-center gap-3">
        <span class="text-xs text-muted-foreground flex-1">Mettre à jour — {{ getSpecialCaseName(svc.name) }} :</span>
        <button type="button" (click)="bumpSpecialCase(svc, -1)" class="w-7 h-7 rounded-lg border border-border bg-background hover:bg-muted text-sm font-bold text-foreground">−</button>
        <span class="min-w-[2rem] text-center font-bold text-sm" style="color:#9C27B0">{{ svcSpecialCase(svc) }}</span>
        <button type="button" (click)="bumpSpecialCase(svc, +1)" class="w-7 h-7 rounded-lg border border-border bg-background hover:bg-muted text-sm font-bold text-foreground">+</button>
        <button type="button" (click)="saveSpecialCase(svc)"
                [disabled]="savingSpecialCase()"
                class="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                style="background:linear-gradient(135deg,#9C27B0,#7B1FA2)">
          <lucide-icon [name]="savingSpecialCase()?'loader-2':'check-circle'" class="w-3.5 h-3.5 inline mr-1" [class.animate-spin]="savingSpecialCase()"></lucide-icon>
          Enregistrer
        </button>
      </div>
      <div *ngIf="specialMsg()" class="mt-2 px-3 py-2 rounded-lg text-xs"
           [style.background]="specialMsgType()==='ok'?'#43A04715':'#E5393515'"
           [style.color]="specialMsgType()==='ok'?'#43A047':'#E53935'">
        {{ specialMsg() }}
      </div>
    </div>

    <!-- BOUTON SIMULATION -->
    <div class="rounded-2xl border bg-card p-5 flex items-center justify-between gap-4"
         style="border-color:#00BCD430;background:#00BCD405">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <lucide-icon name="zap" class="w-4 h-4" style="color:#00BCD4"></lucide-icon>
          <span class="text-sm font-bold text-foreground">Simuler mon service</span>
        </div>
        <div class="text-xs text-muted-foreground">
          Testez vos décisions sur les données de <b>{{ service()?.name }}</b>
        </div>
      </div>
      <button type="button" (click)="goSimService()"
              class="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md flex-shrink-0"
              style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>Simuler ce service
      </button>
    </div>

  </div>
  </div>
</div>
  `,
})
export class ServiceDetailComponent implements OnInit {
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  readonly RED = RED; readonly GREEN = GREEN; readonly PURPLE = PURPLE; readonly ORANGE = ORANGE;

  hospitalId = 0;
  svcId      = 0;
  service    = signal<Service | null>(null);
  loading    = signal(true);
  equipmentList = signal<any[]>([]);

  savingSpecialCase = signal(false);
  specialMsg        = signal<string|null>(null);
  specialMsgType    = signal<'ok'|'err'>('ok');
  private specialCaseLocal = new Map<number, number>();

  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.svcId      = parseInt(this.route.snapshot.paramMap.get('svcId') ?? '0', 10);

    this.api.listServices(this.hospitalId).subscribe({
      next: (list: Service[]) => {
        const found = list.find(s => s.id === this.svcId) ?? null;
        if (found) {
          this.api.getServiceKpis(this.svcId).subscribe({
            next: (kpiData: any) => {
              this.service.set({ ...found, kpis: kpiData.kpis ?? kpiData } as any);
              this.loading.set(false);
            },
            error: () => { this.service.set(found); this.loading.set(false); }
          });
          this.api.getServiceEquipments(this.svcId).subscribe({
            next: (eqs: any[]) => { this.equipmentList.set(eqs); },
            error: () => { this.equipmentList.set([]); }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  // ✅ Retourne le nom de l'équipement — gère 'name' ET 'nom' (les deux noms de champ BDD)
  eqName(eq: any): string {
    return eq.name || eq.nom || '—';
  }

  // ✅ Accepte 'operationnel' (français BDD) ET 'operational' (anglais)
  isOperational(eq: any): boolean {
    const s = (eq.statut ?? eq.status ?? '').toLowerCase().trim();
    return s === 'operationnel' || s === 'operational';
  }

  eqTaux(eq: any): number {
    const qty   = eq.quantite ?? eq.quantity ?? 1;
    const duree = ((eq.duree_utilisation_min || 20) + (eq.duree_utilisation_max || 40)) / 2;
    const taux  = (eq.patients_par_jour * duree * qty) / (24 * 60) * 100;
    return Math.min(100, Math.max(0, Math.round(taux)));
  }

  totalEquipQty(): number {
    return this.equipmentList().reduce((s, eq) => s + (eq.quantite ?? eq.quantity ?? 0), 0);
  }

  isMedecineInterne(name: string): boolean {
    return (name || '').toLowerCase().includes('médecine') || (name || '').toLowerCase().includes('interne');
  }

  getSpecialCaseName(serviceName: string): string {
    const name = (serviceName || '').toLowerCase();
    if (name.includes('médecine') || name.includes('interne')) return 'Pied diabétique';
    if (name.includes('cardiolog')) return 'Insuffisance cardiaque décompensée';
    if (name.includes('chirurgi')) return 'Post-opératoire compliqué';
    if (name.includes('urgence')) return 'Cas non résolus (Hold-over)';
    if (name.includes('pneumolog')) return 'Insuffisance respiratoire chronique';
    if (name.includes('réanimation') || name.includes('reanimation')) return 'Sevrage ventilatoire difficile';
    return 'Cas particulier';
  }

  svcSpecialCase(svc: Service): number {
    const local = this.specialCaseLocal.get(svc.id);
    if (local !== undefined) return local;
    return (svc as any).patients_prediabete ?? 0;
  }

  bumpSpecialCase(svc: Service, delta: number) {
    const current = this.svcSpecialCase(svc);
    const next = Math.min(svc.patients, Math.max(0, current + delta));
    this.specialCaseLocal.set(svc.id, next);
    this.service.set({ ...svc, patients_prediabete: next } as any);
  }

  saveSpecialCase(svc: Service) {
    this.savingSpecialCase.set(true);
    const val = this.svcSpecialCase(svc);
    this.http.put<any>(`${BASE}/services/${svc.id}/kpi-terrain`, {
      patients_prediabete: val
    }).subscribe({
      next: () => {
        this.savingSpecialCase.set(false);
        this.specialMsg.set(`${val} patients « ${this.getSpecialCaseName(svc.name)} » enregistrés.`);
        this.specialMsgType.set('ok');
        setTimeout(() => this.specialMsg.set(null), 3000);
      },
      error: () => {
        this.savingSpecialCase.set(false);
        this.specialMsg.set('Erreur enregistrement.');
        this.specialMsgType.set('err');
      }
    });
  }

  back() { this.router.navigate(['/hospitals', this.hospitalId, 'services']); }
  goCategory(cat: string) { this.router.navigate(['/hospitals', this.hospitalId, 'services', this.svcId, 'kpi', cat]); }
  goSimService() { this.router.navigate(['/simulation'], { queryParams: { serviceId: this.svcId } }); }

  loadPct(svc: Service): number { return svc.beds > 0 ? Math.round((svc.patients / svc.beds) * 100) : 0; }
  statusColor(s: string): string { return s==='critical' ? RED : s==='medium'||s==='high' ? ORANGE : GREEN; }
  statusLabel(s: string): string { return s==='critical' ? 'Critique' : s==='medium'||s==='high' ? 'Attention' : 'Normal'; }
}