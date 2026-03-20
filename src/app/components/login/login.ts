import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  activeRole: 'tenant' | 'owner' = 'tenant';
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  mfaRequired = false;
  mfaToken = '';
  mfaCode = '';

  loginData = {
    email: '',
    password: '',
  };

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
        // Might need to fetch user profile here if the backend didn't send it, but we can assume we are logged in.
        this.redirectAfterLogin();
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
    const payload = {
      username: this.loginData.email,
      password: this.loginData.password
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.mfa_required) {
          this.mfaRequired = true;
          this.mfaToken = res.mfa_token;
        } else {
          this.redirectAfterLogin();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || err.error?.non_field_errors?.[0] || 'Identifiants incorrects.';
      }
    });
  }

  verifyMfa() {
    if (!this.mfaCode) {
      this.errorMessage = 'Veuillez entrer le code Authenticator.';
      return;
    }
    this.isLoading = true;
    this.authService.verifyMfa(this.mfaToken, this.mfaCode).subscribe({
      next: () => {
        this.isLoading = false;
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Code invalide ou expiré.';
      }
    });
  }

  googleLogin() {
    window.location.href = 'http://localhost:8000/api/auth/google/';
  }

  private redirectAfterLogin() {
    if (this.activeRole === 'tenant') {
      this.router.navigate(['/listings']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}