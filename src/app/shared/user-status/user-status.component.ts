import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1.5">
      <span 
        class="w-2 h-2 rounded-full transition-colors"
        [class.bg-green-500]="status === 'online'"
        [class.bg-gray-400]="status === 'offline'"
        [class.status-pulse]="status === 'online'"
      ></span>
      <span 
        class="text-xs transition-colors"
        [class.text-green-600]="status === 'online'"
        [class.text-gray-500]="status === 'offline'"
      >
        {{ status === 'online' ? 'En ligne' : 'Hors ligne' }}
      </span>
    </div>
  `,
  styles: []
})
export class UserStatusComponent {
  @Input() status: 'online' | 'offline' = 'offline';
}
