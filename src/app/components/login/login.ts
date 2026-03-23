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
        // Récupère le profil depuis le backend pour avoir le vrai rôle
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
          this.authService.redirectByRole(res.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.detail ||
          err.error?.non_field_errors?.[0] ||
          'Identifiants incorrects.';
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
      next: (res) => {
        this.isLoading = false;
        this.authService.redirectByRole(res.user);
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

    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    // Sinon redirection par rôle
    const user = this.authService.getCurrentUser();
    this.authService.redirectByRole(user);
  }
}
