// src/app/pages/messaging/messaging.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/auth.service';

import { environment } from '../../../environments/environment';
const BASE = environment.apiUrl;

interface ChatUser   { id: number; name: string; role: string; service?: string; }
interface Conversation {
  id: number; other_user: ChatUser;
  last_message?: string; last_message_at?: string; unread_count: number;
}
interface Message {
  id: number; from_user_id: number; body: string; subject?: string;
  simulation_data?: any; is_read: boolean; created_at: string; is_mine: boolean;
}

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="flex h-full bg-background">

  <!-- COLONNE GAUCHE — conversations -->
  <div class="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">

    <!-- Header -->
    <div class="px-5 py-4 border-b border-border">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <lucide-icon name="users" class="w-5 h-5" style="color:#00BCD4"></lucide-icon>
          <h1 class="font-bold text-foreground">Messagerie</h1>
        </div>
        <span *ngIf="totalUnread() > 0"
              class="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
              style="background:#E53935">{{ totalUnread() }}</span>
      </div>
      <!-- Nouveau message -->
      <button (click)="openNewMsg()"
              class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white text-sm font-semibold"
              style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
        <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>Nouveau message
      </button>
    </div>

    <!-- Liste conversations -->
    <div class="flex-1 overflow-y-auto">
      <div *ngIf="conversations().length === 0" class="p-5 text-center text-sm text-muted-foreground">
        <lucide-icon name="users" class="w-8 h-8 mx-auto mb-2 opacity-20"></lucide-icon>
        Aucune conversation
      </div>
      <button *ngFor="let conv of conversations()"
              (click)="selectConv(conv)"
              class="w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors"
              [style.background]="activeConv()?.id === conv.id ? '#00BCD408' : ''"
              [style.borderLeft]="activeConv()?.id === conv.id ? '3px solid #00BCD4' : '3px solid transparent'">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
               [style.background]="conv.other_user.role === 'directeur' ? 'linear-gradient(135deg,#00BCD4,#0288D1)' : 'linear-gradient(135deg,#43A047,#2E7D32)'">
            <lucide-icon [name]="conv.other_user.role === 'directeur' ? 'brain' : 'stethoscope'" class="w-4 h-4 text-white"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-foreground truncate">{{ conv.other_user.name }}</span>
              <span *ngIf="conv.unread_count > 0"
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                    style="background:#E53935">{{ conv.unread_count }}</span>
            </div>
            <div class="text-[11px] text-muted-foreground truncate">{{ conv.other_user.service ?? conv.other_user.role }}</div>
            <div *ngIf="conv.last_message" class="text-[11px] text-muted-foreground truncate mt-0.5">{{ conv.last_message }}</div>
          </div>
        </div>
      </button>
    </div>
  </div>

  <!-- COLONNE DROITE — messages -->
  <div class="flex-1 flex flex-col min-w-0">

    <!-- Aucune conversation sélectionnée -->
    <div *ngIf="!activeConv() && !newMsgOpen()" class="flex-1 flex items-center justify-center text-center p-8">
      <div>
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background:#00BCD410">
          <lucide-icon name="users" class="w-8 h-8" style="color:#00BCD4"></lucide-icon>
        </div>
        <h2 class="text-lg font-bold text-foreground mb-2">Messagerie HealthSim</h2>
        <p class="text-sm text-muted-foreground">Sélectionnez une conversation ou créez un nouveau message</p>
      </div>
    </div>

    <!-- NOUVEAU MESSAGE -->
    <div *ngIf="newMsgOpen()" class="flex-1 flex flex-col">
      <div class="px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <button (click)="closeNewMsg()" class="p-1.5 rounded-lg hover:bg-muted">
          <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
        </button>
        <h2 class="font-bold text-foreground">Nouveau message</h2>
      </div>
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Destinataire -->
        <label class="block">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destinataire</span>
          <select [(ngModel)]="newMsg.toUserId"
                  class="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-border bg-background">
            <option [ngValue]="null">— Sélectionner —</option>
            <option *ngFor="let u of availableUsers()" [ngValue]="u.id">
              {{ u.name }} — {{ u.service ?? u.role }}
            </option>
          </select>
        </label>
        <!-- Objet -->
        <label class="block">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objet</span>
          <input [(ngModel)]="newMsg.subject" type="text" placeholder="Ex: Demande de ressources — Urgences"
                 class="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-border bg-background"/>
        </label>
        <!-- Message -->
        <label class="block">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</span>
          <textarea [(ngModel)]="newMsg.body" rows="6" placeholder="Votre message..."
                    class="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-border bg-background resize-none"></textarea>
        </label>
        <!-- Joindre simulation -->
        <div *ngIf="hasSimResult()"
             class="rounded-xl border border-border p-3 flex items-center gap-3 cursor-pointer"
             [class.border-primary]="newMsg.attachSim"
             [style.background]="newMsg.attachSim ? '#00BCD408' : ''"
             (click)="newMsg.attachSim = !newMsg.attachSim">
          <lucide-icon name="brain" class="w-4 h-4 flex-shrink-0" style="color:#00BCD4"></lucide-icon>
          <div class="flex-1">
            <div class="text-xs font-bold text-foreground">Joindre les résultats de simulation</div>
            <div class="text-[11px] text-muted-foreground">Partager votre dernière simulation avec ce message</div>
          </div>
          <div class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
               [style.borderColor]="newMsg.attachSim ? '#00BCD4' : '#e2e8f0'"
               [style.background]="newMsg.attachSim ? '#00BCD4' : 'transparent'">
            <lucide-icon *ngIf="newMsg.attachSim" name="check-circle" class="w-3 h-3 text-white"></lucide-icon>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-border bg-card flex justify-end gap-3">
        <button (click)="closeNewMsg()" class="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">
          Annuler
        </button>
        <button (click)="sendMessage()" [disabled]="sending() || !newMsg.toUserId || !newMsg.body"
                class="px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
          <lucide-icon [name]="sending() ? 'loader-2' : 'check-circle'" class="w-4 h-4" [class.animate-spin]="sending()"></lucide-icon>
          {{ sending() ? 'Envoi...' : 'Envoyer' }}
        </button>
      </div>
    </div>

    <!-- CONVERSATION ACTIVE -->
    <ng-container *ngIf="activeConv() && !newMsgOpen()">
      <!-- Header conversation -->
      <div class="px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center"
             [style.background]="activeConv()!.other_user.role === 'directeur' ? 'linear-gradient(135deg,#00BCD4,#0288D1)' : 'linear-gradient(135deg,#43A047,#2E7D32)'">
          <lucide-icon [name]="activeConv()!.other_user.role === 'directeur' ? 'brain' : 'stethoscope'" class="w-4 h-4 text-white"></lucide-icon>
        </div>
        <div>
          <div class="font-bold text-foreground text-sm">{{ activeConv()!.other_user.name }}</div>
          <div class="text-[11px] text-muted-foreground">{{ activeConv()!.other_user.service ?? activeConv()!.other_user.role }}</div>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-5 space-y-3" #msgContainer>
        <div *ngIf="loadingMsgs()" class="text-center text-sm text-muted-foreground py-8">
          <lucide-icon name="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></lucide-icon>
          Chargement...
        </div>
        <div *ngFor="let msg of messages()" class="flex" [class.justify-end]="msg.is_mine">
          <div class="max-w-[70%] space-y-1">
            <!-- Objet -->
            <div *ngIf="msg.subject" class="text-[10px] font-bold uppercase tracking-wider px-3"
                 [style.color]="msg.is_mine ? '#0288D1' : '#43A047'">
              {{ msg.subject }}
            </div>
            <!-- Bulle -->
            <div class="px-4 py-3 rounded-2xl text-sm"
                 [class.rounded-tr-sm]="msg.is_mine"
                 [class.rounded-tl-sm]="!msg.is_mine"
                 [style.background]="msg.is_mine ? 'linear-gradient(135deg,#00BCD4,#0288D1)' : 'var(--muted)'"
                 [class.text-white]="msg.is_mine">
              {{ msg.body }}
            </div>
            <!-- Simulation jointe -->
            <div *ngIf="msg.simulation_data"
                 class="px-3 py-2 rounded-xl border flex items-center gap-2 text-xs cursor-pointer hover:bg-muted"
                 (click)="viewSimData(msg.simulation_data)">
              <lucide-icon name="brain" class="w-3.5 h-3.5 flex-shrink-0" style="color:#00BCD4"></lucide-icon>
              <span class="text-muted-foreground">Résultats de simulation joints</span>
              <lucide-icon name="chevron-right" class="w-3 h-3 text-muted-foreground ml-auto"></lucide-icon>
            </div>
            <!-- Heure -->
            <div class="text-[10px] text-muted-foreground px-1" [class.text-right]="msg.is_mine">
              {{ formatTime(msg.created_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Zone de saisie -->
      <div class="px-5 py-4 border-t border-border bg-card">
        <div class="flex items-end gap-3">
          <textarea [(ngModel)]="replyBody" rows="2" placeholder="Votre message..."
                    (keydown.control.enter)="sendReply()"
                    class="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border bg-background resize-none focus:outline-none focus:border-primary transition-colors"></textarea>
          <button (click)="sendReply()" [disabled]="sending() || !replyBody.trim()"
                  class="p-3 rounded-xl text-white disabled:opacity-50 flex-shrink-0"
                  style="background:linear-gradient(135deg,#00BCD4,#0288D1)">
            <lucide-icon [name]="sending() ? 'loader-2' : 'arrow-right'" class="w-4 h-4" [class.animate-spin]="sending()"></lucide-icon>
          </button>
        </div>
        <div class="text-[10px] text-muted-foreground mt-1.5 px-1">Ctrl+Entrée pour envoyer</div>
      </div>
    </ng-container>
  </div>
</div>

<!-- Modal résultats simulation -->
<div *ngIf="simModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="simModal.set(null)">
  <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6" (click)="$event.stopPropagation()">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-foreground flex items-center gap-2">
        <lucide-icon name="brain" class="w-5 h-5" style="color:#00BCD4"></lucide-icon>
        Résultats de simulation
      </h3>
      <button (click)="simModal.set(null)"><lucide-icon name="x" class="w-4 h-4"></lucide-icon></button>
    </div>
    <div class="space-y-2 text-sm">
      <div *ngFor="let kv of simModalEntries()" class="flex justify-between py-1.5 border-b border-border">
        <span class="text-muted-foreground">{{ kv.key }}</span>
        <span class="font-semibold text-foreground">{{ kv.value }}</span>
      </div>
    </div>
  </div>
</div>
  `,
})
export class MessagingComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  conversations  = signal<Conversation[]>([]);
  activeConv     = signal<Conversation | null>(null);
  messages       = signal<Message[]>([]);
  availableUsers = signal<ChatUser[]>([]);
  newMsgOpen     = signal(false);
  loadingMsgs    = signal(false);
  sending        = signal(false);
  simModal       = signal<any>(null);

  replyBody = '';
  newMsg = { toUserId: null as number|null, subject: '', body: '', attachSim: false };

  totalUnread = computed(() => this.conversations().reduce((a, c) => a + c.unread_count, 0));

  private pollInterval: any;

  ngOnInit() {
    this.loadConversations();
    this.loadUsers();
    this.pollInterval = setInterval(() => this.loadConversations(), 10000);
  }

  ngOnDestroy() { clearInterval(this.pollInterval); }

  loadConversations() {
    this.http.get<Conversation[]>(`${BASE}/messaging/conversations`).subscribe({
      next: c => this.conversations.set(c), error: () => {}
    });
  }

  loadUsers() {
    this.http.get<ChatUser[]>(`${BASE}/messaging/users`).subscribe({
      next: u => this.availableUsers.set(u), error: () => {}
    });
  }

  selectConv(conv: Conversation) {
    this.activeConv.set(conv);
    this.newMsgOpen.set(false);
    this.loadingMsgs.set(true);
    this.http.get<Message[]>(`${BASE}/messaging/conversations/${conv.id}/messages`).subscribe({
      next: m => { this.messages.set(m); this.loadingMsgs.set(false); this.loadConversations(); },
      error: () => this.loadingMsgs.set(false),
    });
  }

  openNewMsg()  { this.newMsgOpen.set(true); this.activeConv.set(null); this.newMsg = { toUserId: null, subject: '', body: '', attachSim: false }; }
  closeNewMsg() { this.newMsgOpen.set(false); }

  sendMessage() {
    if (!this.newMsg.toUserId || !this.newMsg.body.trim()) return;
    this.sending.set(true);
    const simData = this.newMsg.attachSim ? this.getSimResult() : null;
    this.http.post(`${BASE}/messaging/send`, {
      to_user_id: this.newMsg.toUserId,
      subject: this.newMsg.subject,
      body: this.newMsg.body,
      simulation_data: simData,
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.closeNewMsg();
        this.loadConversations();
      },
      error: () => this.sending.set(false),
    });
  }

  sendReply() {
    const conv = this.activeConv();
    if (!conv || !this.replyBody.trim()) return;
    this.sending.set(true);
    this.http.post<Message>(`${BASE}/messaging/send`, {
      to_user_id: conv.other_user.id,
      body: this.replyBody,
    }).subscribe({
      next: msg => {
        this.messages.update(m => [...m, msg]);
        this.replyBody = '';
        this.sending.set(false);
        this.loadConversations();
      },
      error: () => this.sending.set(false),
    });
  }

  hasSimResult(): boolean {
    return !!localStorage.getItem('hs_sim_result');
  }

  getSimResult(): any {
    try { return JSON.parse(localStorage.getItem('hs_sim_result') ?? 'null'); } catch { return null; }
  }

  viewSimData(data: any) { this.simModal.set(data); }

  simModalEntries(): { key: string; value: string }[] {
    const d = this.simModal();
    if (!d) return [];
    return Object.entries(d).slice(0, 10).map(([k, v]) => ({ key: k, value: String(v) }));
  }

  formatTime(dt: string): string {
    const d = new Date(dt);
    return d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  }
}