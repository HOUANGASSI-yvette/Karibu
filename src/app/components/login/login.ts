import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import {
  LucideAngularModule,
  Eye, EyeOff, Mail, Lock, Check, ShieldCheck,
  AlertCircle, LoaderCircle, ArrowRight, ArrowLeft,
  KeyRound, Home,
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  readonly Eye          = Eye;
  readonly EyeOff       = EyeOff;
  readonly Mail         = Mail;
  readonly Lock         = Lock;
  readonly Check        = Check;
  readonly ShieldCheck  = ShieldCheck;
  readonly AlertCircle  = AlertCircle;
  readonly LoaderCircle = LoaderCircle;
  readonly ArrowRight   = ArrowRight;
  readonly ArrowLeft    = ArrowLeft;
  readonly KeyRound     = KeyRound;
  readonly Home         = Home;

  showPassword = signal(false);
  rememberMe   = signal(false);
  isLoading    = signal(false);
  errorMessage = signal('');
  mfaRequired  = signal(false);

  mfaToken = '';
  mfaCode  = '';
  loginData = { email: '', password: '' };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['access_token'] && params['refresh_token']) {
        this.isLoading.set(true);
        this.authService.setTokens({ access: params['access_token'], refresh: params['refresh_token'] });
        this.authService.getProfile().subscribe({
          next: (user) => {
            this.isLoading.set(false);
            this.authService.currentUser.set(user);
            localStorage.setItem('user', JSON.stringify(user));
            this.authService.redirectByRole(user);
          },
          error: () => {
            this.isLoading.set(false);
            this.router.navigate(['/']);
          },
        });
      }
    });
  }

  togglePassword() { this.showPassword.update(v => !v); }
  toggleRemember()  { this.rememberMe.update(v => !v); }

  cancelMfa() {
    this.mfaRequired.set(false);
    this.mfaToken = '';
    this.mfaCode  = '';
    this.errorMessage.set('');
  }

  onSubmit() {
    this.errorMessage.set('');

    if (this.mfaRequired()) {
      this.verifyMfa();
      return;
    }

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage.set('Veuillez remplir tous les champs.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login({
      email:    this.loginData.email,
      password: this.loginData.password,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.mfa_required) {
          this.mfaRequired.set(true);
          this.mfaToken = res.mfa_token;
        } else {
          this.toast.success('Connexion réussie !');
          this.authService.redirectByRole(res.user);
        }
      },
      error: (err) => {
        // ← CRITIQUE : toujours remettre isLoading à false en cas d'erreur
        this.isLoading.set(false);
        const msg = this.authService.extractError(err);
        this.errorMessage.set(msg);
        this.toast.error(msg);
      },
    });
  }

  verifyMfa() {
    if (!this.mfaCode || this.mfaCode.length < 6) {
      this.errorMessage.set('Veuillez entrer le code à 6 chiffres.');
      return;
    }
    this.isLoading.set(true);

    this.authService.verifyMfa(this.mfaToken, this.mfaCode).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success('Connexion réussie !');
        this.authService.redirectByRole(res.user);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mfaCode = '';
        const msg = this.authService.extractError(err);
        this.errorMessage.set(msg);
        this.toast.error(msg);
      },
    });
  }

  googleLogin() {
    window.location.href = 'http://localhost:8000/api/auth/google/';
  }
}
