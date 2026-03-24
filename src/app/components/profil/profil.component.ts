import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  User, Mail, Lock, ShieldCheck, ShieldAlert, ShieldX,
  FileText, ChevronRight, Save, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Smartphone,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { ProprietaireService, ProprietaireProfil } from '../../services/proprietaire.service';
import { ToastService } from '../../shared/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './profil.component.html',
})
export class ProfilComponent implements OnInit {
  readonly UserIcon       = User;
  readonly MailIcon       = Mail;
  readonly LockIcon       = Lock;
  readonly ShieldCheck    = ShieldCheck;
  readonly ShieldAlert    = ShieldAlert;
  readonly ShieldX        = ShieldX;
  readonly FileTextIcon   = FileText;
  readonly ChevronRight   = ChevronRight;
  readonly SaveIcon       = Save;
  readonly EyeIcon        = Eye;
  readonly EyeOffIcon     = EyeOff;
  readonly AlertIcon      = AlertCircle;
  readonly CheckIcon      = CheckCircle;
  readonly ArrowLeft      = ArrowLeft;
  readonly SmartphoneIcon = Smartphone;

  activeTab = signal<'infos' | 'securite' | 'mfa'>('infos');
  currentUser = signal<any>(null);

  // Infos
  editFirst    = '';
  editLast     = '';
  editUsername = '';
  isSavingInfos = signal(false);

  // Mot de passe
  oldPassword = '';
  newPassword = '';
  confirmPw   = '';
  showOld    = signal(false);
  showNew    = signal(false);
  isSavingPw = signal(false);

  // Proprio
  proprietaireProfil = signal<ProprietaireProfil | null>(null);
  isLoadingProprio   = signal(false);

  // MFA
  mfaStep    = signal<'idle' | 'setup' | 'verify-disable'>('idle');
  mfaQrCode  = signal<string | null>(null);
  mfaSecret  = signal<string | null>(null);
  mfaCode    = '';
  mfaLoading = signal(false);

  constructor(
    public authService: AuthService,
    private proprietaireService: ProprietaireService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const u = this.authService.getCurrentUser();
    this.currentUser.set(u);
    this.editFirst    = u?.first_name ?? '';
    this.editLast     = u?.last_name  ?? '';
    this.editUsername = u?.username   ?? '';
    if (u?.role === 'proprietaire') this.loadProprietaire();
  }

  get role()          { return this.currentUser()?.role ?? ''; }
  get isProprietaire(){ return this.role === 'proprietaire'; }
  get mfaEnabled()    { return this.currentUser()?.mfa_is_enabled ?? false; }

  setTab(t: 'infos' | 'securite' | 'mfa') { this.activeTab.set(t); }
  toggleShowOld() { this.showOld.update(v => !v); }
  toggleShowNew() { this.showNew.update(v => !v); }

  loadProprietaire() {
    this.isLoadingProprio.set(true);
    this.proprietaireService.monProfil().subscribe({
      next:  p => { this.proprietaireProfil.set(p); this.isLoadingProprio.set(false); },
      error: () => this.isLoadingProprio.set(false),
    });
  }

  saveInfos() {
    const u = this.currentUser();
    if (!u) return;
    this.isSavingInfos.set(true);
    this.http.patch(`${environment.apiUrl}/auth/users/${u.id}/update/`, {
      first_name: this.editFirst,
      last_name:  this.editLast,
      username:   this.editUsername,
    }).subscribe({
      next: (updated: any) => {
        this.isSavingInfos.set(false);
        this.authService.currentUser.set(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        this.currentUser.set(updated);
        this.toast.success('Profil mis à jour.');
      },
      error: (err) => {
        this.isSavingInfos.set(false);
        this.toast.error(err?.error?.detail ?? 'Erreur lors de la sauvegarde.');
      },
    });
  }

  changePw() {
    if (this.newPassword !== this.confirmPw) {
      this.toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    this.isSavingPw.set(true);
    this.http.post(`${environment.apiUrl}/auth/change-password/`, {
      old_password: this.oldPassword,
      new_password: this.newPassword,
    }).subscribe({
      next: () => {
        this.isSavingPw.set(false);
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPw   = '';
        this.toast.success('Mot de passe modifié avec succès.');
      },
      error: (err) => {
        this.isSavingPw.set(false);
        this.toast.error(err?.error?.old_password?.[0] ?? err?.error?.detail ?? 'Erreur.');
      },
    });
  }

  startMfaSetup() {
    this.mfaLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/auth/mfa/setup/`).subscribe({
      next: (res) => {
        this.mfaQrCode.set(res.qr_code);
        this.mfaSecret.set(res.secret);
        this.mfaStep.set('setup');
        this.mfaLoading.set(false);
      },
      error: () => {
        this.mfaLoading.set(false);
        this.toast.error('Erreur lors de la génération du QR code.');
      },
    });
  }

  activateMfa() {
    this.mfaLoading.set(true);
    this.http.post<any>(`${environment.apiUrl}/auth/mfa/activate/`, { code: this.mfaCode }).subscribe({
      next: () => {
        this.mfaLoading.set(false);
        this.mfaStep.set('idle');
        this.mfaCode = '';
        const u = { ...this.currentUser(), mfa_is_enabled: true };
        this.authService.currentUser.set(u);
        localStorage.setItem('user', JSON.stringify(u));
        this.currentUser.set(u);
        this.toast.success('Double authentification activée.');
      },
      error: (err) => {
        this.mfaLoading.set(false);
        this.toast.error(err?.error?.detail ?? 'Code invalide.');
      },
    });
  }

  disableMfa() {
    this.mfaLoading.set(true);
    this.http.post<any>(`${environment.apiUrl}/auth/mfa/disable/`, { code: this.mfaCode }).subscribe({
      next: () => {
        this.mfaLoading.set(false);
        this.mfaStep.set('idle');
        this.mfaCode = '';
        const u = { ...this.currentUser(), mfa_is_enabled: false };
        this.authService.currentUser.set(u);
        localStorage.setItem('user', JSON.stringify(u));
        this.currentUser.set(u);
        this.toast.success('Double authentification désactivée.');
      },
      error: (err) => {
        this.mfaLoading.set(false);
        this.toast.error(err?.error?.detail ?? 'Code invalide.');
      },
    });
  }

  cancelMfa() { this.mfaStep.set('idle'); this.mfaCode = ''; }

  statutLabel(s: string) {
    return ({ en_attente: 'En attente de vérification', verifie: 'Compte vérifié', rejete: 'Dossier rejeté' } as any)[s] ?? s;
  }

  countByStatut(s: string) {
    return (this.proprietaireProfil()?.documents ?? []).filter(d => d.statut === s).length;
  }
}
