import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router'
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';

  // Using Angular 16+ signals for reactive user state
  public currentUser = signal<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials).pipe(
      tap((res: any) => {
        if (res.tokens) {
          this.setTokens(res.tokens);
          this.currentUser.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  verifyMfa(mfa_token: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa-verify/`, { mfa_token, code }).pipe(
      tap((res: any) => {
        if (res.tokens) {
          this.setTokens(res.tokens);
          this.currentUser.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/`);
  }

  setTokens(tokens: { access: string, refresh: string }) {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  redirectByRole(user: any) {
    const role = user?.role;
    if (role === 'proprietaire') {
      this.router.navigate(['/dashboard']);
    } else if (role === 'locataire') {
      this.router.navigate(['/listings']);
    } else if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }
  getCurrentUser(): any {
    return this.currentUser() || JSON.parse(localStorage.getItem('user') || 'null');
  }

  private loadUserFromStorage() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser.set(JSON.parse(user));
    }
  }
}
