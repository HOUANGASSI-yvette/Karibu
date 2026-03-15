import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

  activeRole: 'tenant' | 'owner' = 'tenant';
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  loginData = {
    email: '',
    password: '',
  };

  constructor(private router: Router) {}

  setRole(role: 'tenant' | 'owner') {
    this.activeRole = role;
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.redirectAfterLogin();
    }, 1200);
  }

  private redirectAfterLogin() {
    if (this.activeRole === 'tenant') {
      this.router.navigate(['/listings']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}