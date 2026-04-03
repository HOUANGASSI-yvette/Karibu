import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isTyping" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 animate-in slide-in-from-bottom-2">
      <span>{{ userName }} est en train d'écrire</span>
      <div class="flex gap-1">
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-bounce"></span>
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-bounce"></span>
        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-bounce"></span>
      </div>
    </div>
  `,
  styles: []
})
export class TypingIndicatorComponent {
  @Input() isTyping: boolean = false;
  @Input() userName: string = 'Utilisateur';
}
