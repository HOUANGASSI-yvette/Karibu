import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardMessage } from '../../dashboard';

@Component({
  selector: 'app-messages-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages-section.html',
})
export class MessagesSectionComponent {
  @Input() messages: DashboardMessage[] = [];
  @Output() messageRead = new EventEmitter<string>();

  get unreadCount() { return this.messages.filter(m => !m.read).length; }

  markAsRead(id: string) { this.messageRead.emit(id); }
}
