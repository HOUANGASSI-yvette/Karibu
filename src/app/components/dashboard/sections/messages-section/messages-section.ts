import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, MessageSquare, RefreshCw, ExternalLink } from 'lucide-angular';
import { ChatService, ChatRoom } from '../../../../services/chat.service';

@Component({
  selector: 'app-messages-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './messages-section.html',
})
export class MessagesSectionComponent implements OnInit {
  readonly MessageIcon = MessageSquare;
  readonly RefreshIcon = RefreshCw;
  readonly OpenIcon    = ExternalLink;

  rooms:     ChatRoom[] = [];
  isLoading  = true;
  hasError   = false;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    this.loadRooms();
  }

  private refresh(fn: () => void) {
    this.zone.run(() => { fn(); this.cdr.detectChanges(); });
  }

  loadRooms() {
    this.isLoading = true;
    this.hasError  = false;
    this.cdr.detectChanges();
    this.chatService.getRooms().subscribe({
      next:  r  => this.refresh(() => { this.rooms = r; this.isLoading = false; }),
      error: () => this.refresh(() => { this.isLoading = false; this.hasError = true; }),
    });
  }

  openRoom(roomId: number) {
    this.zone.run(() => {
      this.router.navigate(['/messages'], { queryParams: { roomId } });
    });
  }

  get unreadCount(): number { return this.rooms.reduce((acc, r) => acc + r.unread_count, 0); }
}
