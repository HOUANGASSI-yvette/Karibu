import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRequest } from '../../dashboard';

@Component({
  selector: 'app-requests-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests-section.html',
})
export class RequestsSectionComponent {
  @Input() requests: ReservationRequest[] = [];
  @Output() requestHandled = new EventEmitter<{ id: string; action: 'accepted' | 'rejected' }>();

  get pendingCount() { return this.requests.filter(r => r.status === 'pending').length; }

  handleRequest(id: string, action: 'accepted' | 'rejected') {
    this.requestHandled.emit({ id, action });
  }
}
