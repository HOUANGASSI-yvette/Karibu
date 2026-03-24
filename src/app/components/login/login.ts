import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  LucideAngularModule,
  Eye, EyeOff, Mail, Lock, Check, ShieldCheck,
  AlertCircle, LoaderCircle, ArrowRight, ArrowLeft,
  KeyRound, Home
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  // Icônes
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Check = Check;
  readonly ShieldCheck = ShieldCheck;
  readonly AlertCircle = AlertCircle;
  readonly LoaderCircle = LoaderCircle;
  readonly ArrowRight = ArrowRight;
  readonly ArrowLeft = ArrowLeft;
  readonly KeyRound = KeyRound;
  readonly Home = Home;

  activeRole: 'tenant' | 'owner' = 'tenant';
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  mfaRequired = false;
  mfaToken = '';
  mfaCode = '';

  loginData = { email: '', password: '' };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['access_token'] && params['refresh_token']) {
        this.authService.setTokens({
          access: params['access_token'],
          refresh: params['refresh_token']
        });
        this.authService.getProfile().subscribe({
          next: (user) => {
            this.authService.currentUser.set(user);
            localStorage.setItem('user', JSON.stringify(user));
            this.authService.redirectByRole(user);
          },
          error: () => this.router.navigate(['/'])
        });
      }
    });
  }

  setRole(role: 'tenant' | 'owner') {
    this.activeRole = role;
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  cancelMfa() {
    this.mfaRequired = false;
    this.mfaToken = '';
    this.mfaCode = '';
    this.errorMessage = '';
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.mfaRequired) {
      this.verifyMfa();
      return;
    }

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isLoading = true;

    // On envoie email dans le champ "email" — le backend LoginSerializer utilise email
    this.authService.login({
      email: this.loginData.email,
      password: this.loginData.password
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.mfa_required) {
          this.mfaRequired = true;
          this.mfaToken = res.mfa_token;
        } else {
          this.authService.redirectByRole(res.user);
        }
      },
      error: (err) => {
        this.isLoading = false;  // ← stop immédiatement
        this.errorMessage = this.authService.extractError(err);
      }
    });
  }

  verifyMfa() {
    if (!this.mfaCode || this.mfaCode.length < 6) {
      this.errorMessage = 'Veuillez entrer le code à 6 chiffres.';
      return;
    }
    this.isLoading = true;
    this.authService.verifyMfa(this.mfaToken, this.mfaCode).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.authService.redirectByRole(res.user);
      },
      error: (err) => {
        this.isLoading = false;  // ← stop immédiatement
        this.mfaCode = '';       // reset le champ
        this.errorMessage = this.authService.extractError(err);
      }
    });
  }

  googleLogin() {
    window.location.href = 'http://localhost:8000/api/auth/google/';
  }
}
