import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import {
  LucideAngularModule,
  Eye, EyeOff, AlertCircle, LoaderCircle,
  Check, CheckCircle, ArrowRight, ArrowLeft,
  KeyRound, Home, Mail, Lock, User, Phone,
  MapPin, Wallet, Building2
} from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  readonly Eye          = Eye;
  readonly EyeOff       = EyeOff;
  readonly AlertCircle  = AlertCircle;
  readonly LoaderCircle = LoaderCircle;
  readonly Check        = Check;
  readonly CheckCircle  = CheckCircle;
  readonly ArrowRight   = ArrowRight;
  readonly ArrowLeft    = ArrowLeft;
  readonly KeyRound     = KeyRound;
  readonly Home         = Home;
  readonly Mail         = Mail;
  readonly Lock         = Lock;
  readonly User         = User;
  readonly Phone        = Phone;
  readonly MapPin       = MapPin;
  readonly Wallet       = Wallet;
  readonly Building2    = Building2;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  currentStep      = 1;
  selectedRole: 'tenant' | 'owner' | null = null;
  showPassword     = false;
  acceptedTerms    = false;
  isLoading        = false;
  errorMessage     = '';
  passwordStrength = 0;
  strengthLabel    = '';

  steps = [
    { num: 1, label: 'Profil' },
    { num: 2, label: 'Compte' },
    { num: 3, label: 'Détails' },
  ];

  registerData = {
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', city: '',
    budget: '', propertyTypes: [] as string[], propertyCount: '',
  };

  cities        = ['Lomé', 'Kara', 'Kpalimé', 'Sokodé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Notsé', 'Autre'];
  budgets       = [
    { value: '50000',  label: "Jusqu'à 50 000 CFA" },
    { value: '75000',  label: "Jusqu'à 75 000 CFA" },
    { value: '100000', label: "Jusqu'à 100 000 CFA" },
    { value: '150000', label: "Jusqu'à 150 000 CFA" },
    { value: '200000', label: "Jusqu'à 200 000 CFA" },
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
      "Publication illimitée d'annonces",
      'Tableau de bord de gestion multi-biens',
      'Encaissement des loyers et quittances auto',
      'Contrats numériques et signatures en ligne',
    ];
  }

  togglePropertyType(type: string) {
    const idx = this.registerData.propertyTypes.indexOf(type);
    if (idx === -1) this.registerData.propertyTypes.push(type);
    else            this.registerData.propertyTypes.splice(idx, 1);
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  updatePasswordStrength() {
    const pwd = this.registerData.password;
    let score = 0;
    if (pwd.length >= 8)           score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd))  score++;
    this.passwordStrength = score;
    this.strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][score] ?? '';
  }

  getStrengthBarClass(bar: number): string {
    if (bar > this.passwordStrength) return 'bg-stone-200';
    return ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'][this.passwordStrength] ?? 'bg-stone-200';
  }

  getStrengthTextClass(): string {
    return (['', 'text-red-500', 'text-amber-600', 'text-lime-600', 'text-green-600'][this.passwordStrength] ?? '') + ' font-medium';
  }

  nextStep() {
    this.errorMessage = '';
    if (this.currentStep === 1 && !this.selectedRole) return;
    if (this.currentStep === 2) {
      if (!this.registerData.firstName || !this.registerData.lastName ||
        !this.registerData.email    || !this.registerData.password) {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
        this.toast.warning(this.errorMessage);
        return;
      }
      if (this.registerData.password !== this.registerData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas.';
        this.toast.warning(this.errorMessage);
        return;
      }
      if (this.registerData.password.length < 8) {
        this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
        this.toast.warning(this.errorMessage);
        return;
      }
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
    this.errorMessage = '';
  }

  onSubmit() {
    if (!this.acceptedTerms) {
      this.toast.warning("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const generatedUsername = this.registerData.email.split('@')[0] + Math.floor(Math.random() * 1000);

    const payload: any = {
      username:   generatedUsername,
      email:      this.registerData.email,
      password:   this.registerData.password,
      role:       this.selectedRole === 'tenant' ? 'locataire' : 'proprietaire',
      first_name: this.registerData.firstName,
      last_name:  this.registerData.lastName,
      telephone:  this.registerData.phone,
      city:       this.registerData.city,
    };

    if (this.selectedRole === 'tenant') {
      payload.budget         = this.registerData.budget;
      payload.property_types = this.registerData.propertyTypes;
    } else {
      payload.property_count = this.registerData.propertyCount;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.tokens) {
          this.authService.setTokens({ access: res.tokens.access, refresh: res.tokens.refresh });
        }
        this.toast.success('Compte créé avec succès !');
        this.currentStep = 4;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {

        this.isLoading    = false;
        this.errorMessage = this.authService.extractError(err);
        this.toast.error(this.errorMessage);
      },
    });
  }
}
