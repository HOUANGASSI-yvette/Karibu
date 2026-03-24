import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-users-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users-section.html',
})
export class AdminUsersSectionComponent implements OnInit {
  users = signal<any[]>([]);
  isLoading = signal(true);
  filterRole = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/auth/users/`).subscribe({
      next: (data) => { this.users.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  get filtered() {
    const r = this.filterRole();
    return r ? this.users().filter(u => u.role === r) : this.users();
  }

  setFilter(r: string) { this.filterRole.set(r); }

  roleLabel(r: string) {
    return ({ proprietaire: 'Propriétaire', locataire: 'Locataire', admin: 'Admin' } as any)[r] ?? r;
  }

  roleClass(r: string) {
    return ({
      proprietaire: 'bg-amber-50 text-amber-700 border-amber-200',
      locataire:    'bg-blue-50 text-blue-700 border-blue-200',
      admin:        'bg-stone-100 text-stone-700 border-stone-300',
    } as any)[r] ?? '';
  }
}
