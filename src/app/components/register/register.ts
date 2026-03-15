import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  currentStep = 1;
  selectedRole: 'tenant' | 'owner' | null = null;
  showPassword = false;
  acceptedTerms = false;
  isLoading = false;
  errorMessage = '';
  passwordStrength = 0;
  strengthLabel = '';

  steps = [
    { num: 1, label: 'Profil' },
    { num: 2, label: 'Compte' },
    { num: 3, label: 'Détails' },
  ];

  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    budget: '',
    propertyTypes: [] as string[],
    propertyCount: '',
  };

  cities = ['Lomé', 'Kara', 'Kpalimé', 'Sokodé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Notsé', 'Autre'];

  budgets = [
    { value: '50000', label: 'Jusqu\'à 50 000 CFA' },
    { value: '75000', label: 'Jusqu\'à 75 000 CFA' },
    { value: '100000', label: 'Jusqu\'à 100 000 CFA' },
    { value: '150000', label: 'Jusqu\'à 150 000 CFA' },
    { value: '200000', label: 'Jusqu\'à 200 000 CFA' },
    { value: '200000+', label: 'Plus de 200 000 CFA' },
  ];

  propertyTypes = ['Studio', 'T1', 'T2', 'T3', 'T4+', 'Maison'];

  selectRole(role: 'tenant' | 'owner') {
    this.selectedRole = role;
  }

  getRoleBenefits(): string[] {
    if (this.selectedRole === 'tenant') {
      return [
        'Accès aux annonces vérifiées',
        'Messagerie directe avec les propriétaires',
        'Planification de visites en ligne',
        'Espace locataire : loyers, quittances, contrats',
      ];
    }
    return [
      'Publication illimitée d\'annonces',
      'Tableau de bord de gestion multi-biens',
      'Encaissement des loyers et quittances auto',
      'Contrats numériques et signatures en ligne',
    ];
  }

  togglePropertyType(type: string) {
    const idx = this.registerData.propertyTypes.indexOf(type);
    if (idx === -1) {
      this.registerData.propertyTypes.push(type);
    } else {
      this.registerData.propertyTypes.splice(idx, 1);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  updatePasswordStrength() {
    const pwd = this.registerData.password;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    this.passwordStrength = score;

    const labels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    this.strengthLabel = labels[score] ?? '';
  }

  getStrengthBarClass(bar: number): string {
    if (bar > this.passwordStrength) return 'bg-stone-200';
    const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'];
    return colors[this.passwordStrength] ?? 'bg-stone-200';
  }

  getStrengthTextClass(): string {
    const classes = ['', 'text-red-500', 'text-amber-600', 'text-lime-600', 'text-green-600'];
    return `${classes[this.passwordStrength] ?? ''} font-medium`;
  }

  nextStep() {
    this.errorMessage = '';

    if (this.currentStep === 1 && !this.selectedRole) return;

    if (this.currentStep === 2) {
      if (!this.registerData.firstName || !this.registerData.lastName ||
          !this.registerData.email || !this.registerData.password) {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
        return;
      }
      if (this.registerData.password !== this.registerData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas.';
        return;
      }
      if (this.registerData.password.length < 8) {
        this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
        return;
      }
    }

    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onSubmit() {
    if (!this.acceptedTerms) return;
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.currentStep = 4;
      console.log('Registration data:', { ...this.registerData, role: this.selectedRole });
    }, 1800);
  }
}