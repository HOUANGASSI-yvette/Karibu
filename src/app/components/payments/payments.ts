import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BailService } from '../../services/bail.service';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
  <app-navbar variant="dashboard" pageTitle="Paiements"></app-navbar>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-xl font-semibold mb-4">Paiements pour le bail #{{ bailId }}</h1>

    <div *ngIf="isLoading">Chargement…</div>

    <div *ngIf="!isLoading">
      <div class="mb-4">
        <h2 class="font-medium">Historique</h2>
        <ul>
          <li *ngFor="let p of paiements" class="py-2 border-b">
            {{ p.mois_concerne }} — {{ p.montant | number:'1.0-0' }} CFA — {{ p.statut }}
          </li>
        </ul>
      </div>

      <div class="mt-6">
        <h2 class="font-medium">Simuler un paiement</h2>
        <form (ngSubmit)="simuler()" class="space-y-3">
          <div>
            <label class="text-xs">Montant (CFA)</label>
            <input type="number" [(ngModel)]="montant" name="montant" required class="w-full border px-2 py-1">
          </div>
          <div>
            <label class="text-xs">Mois concerné</label>
            <input type="date" [(ngModel)]="mois" name="mois" required class="w-full border px-2 py-1">
          </div>
          <div>
            <button type="submit" class="px-4 py-2 bg-amber-800 text-white">Simuler paiement</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `
})
export class PaymentsPage implements OnInit {
  bailId!: number;
  paiements: any[] = [];
  isLoading = true;
  montant = 0;
  mois = '';

  constructor(private route: ActivatedRoute, private bailService: BailService) {}

  ngOnInit() {
    this.bailId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPaiements();
  }

  loadPaiements() {
    this.isLoading = true;
    this.bailService.getPaiements(this.bailId).subscribe({
      next: (p) => { this.paiements = p; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  simuler() {
    const payload = { montant: this.montant, mois_concerne: this.mois };
    this.bailService.simulerPaiement(this.bailId, payload).subscribe({
      next: () => { this.loadPaiements(); this.montant = 0; this.mois = ''; },
      error: () => { /* toast? */ }
    });
  }
}
