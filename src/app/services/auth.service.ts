import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
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
          this.setUser(res.user);
        }
      })
    );
  }

  verifyMfa(mfa_token: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa-verify/`, { mfa_token, code }).pipe(
      tap((res: any) => {
        if (res.tokens) {
          this.setTokens(res.tokens);
          this.setUser(res.user);
        }
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/`);
  }

  /**
   * Recharge le profil complet depuis l'API et met à jour
   * le signal + localStorage. Appelé par la navbar à chaque
   * navigation pour refléter les changements de statut.
   */
  refreshCurrentUser(): void {
    this.http.get(`${this.apiUrl}/profile/`).subscribe({
      next: (user: any) => this.setUser(user),
      error: () => { /* silencieux */ },
    });
  }

  setTokens(tokens: { access: string; refresh: string }) {
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

  extractError(err: any): string {
    return err?.error?.error?.message || 'Une erreur est survenue.';
  }

  redirectByRole(user: any) {
    const role = user?.role;
    if (role === 'proprietaire')     this.router.navigate(['/dashboard']);
    else if (role === 'locataire')   this.router.navigate(['/listings']);
    else if (role === 'admin')       this.router.navigate(['/admin']);
    else                             this.router.navigate(['/']);
  }

  getCurrentUser(): any {
    return this.currentUser() ?? JSON.parse(localStorage.getItem('user') || 'null');
  }

  // ── Privé ────────────────────────────────────────────────
  private setUser(user: any) {
    this.currentUser.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private loadUserFromStorage() {
    const raw = localStorage.getItem('user');
    if (raw) {
      try { this.currentUser.set(JSON.parse(raw)); }
      catch { this.currentUser.set(null); }
    }
  }
}
