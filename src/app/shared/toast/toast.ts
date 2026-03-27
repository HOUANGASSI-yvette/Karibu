import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../toast.service';
import { LucideAngularModule, CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 space-y-2">
      <ng-container *ngFor="let toast of toastService.toasts(); trackBy: trackById">
        <div [ngClass]="getClass(toast.type)"
             class="flex items-center gap-3 px-5 py-3 text-sm font-medium shadow-xl min-w-[280px] animate-in slide-in-from-right">
          <lucide-icon [img]="getIcon(toast.type)" class="w-4 h-4 flex-shrink-0"></lucide-icon>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="opacity-70 hover:opacity-100 transition-opacity">
            <lucide-icon [img]="XIcon" class="w-3 h-3"></lucide-icon>
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class ToastComponent {
  readonly CheckIcon    = CheckCircle;
  readonly ErrorIcon    = XCircle;
  readonly InfoIcon     = Info;
  readonly WarningIcon  = AlertTriangle;
  readonly XIcon        = X;

  constructor(public toastService: ToastService) {}

  getIcon(type: string) {
    return { success: this.CheckIcon, error: this.ErrorIcon, info: this.InfoIcon, warning: this.WarningIcon }[type] || this.InfoIcon;
  }

  getClass(type: string): string {
    return {
      success: 'bg-stone-900 text-white',
      error:   'bg-red-600 text-white',
      info:    'bg-amber-800 text-white',
      warning: 'bg-orange-600 text-white',
    }[type] || 'bg-stone-900 text-white';
  }

  trackById(_i: number, t: { id: number }) { return t.id; }
}
