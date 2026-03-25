import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { ChatService, ChatRoom, ChatMessage } from '../../services/chat.service';
import { ToastService } from '../../shared/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Send, Search, WifiOff, RefreshCw, FileText, ChevronRight } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BailModalComponent } from '../../shared/bail-modal/bail-modal.component';

export interface RoomRequest {
  id: number;
  property_title: string;
  status: 'pending' | 'accepted' | 'rejected';
  visit_date?: string;
  bail_id?: number;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule, BailModalComponent],
  templateUrl: './messages.html',
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd')      messagesEnd!: ElementRef;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  readonly SendIcon    = Send;
  readonly SearchIcon  = Search;
  readonly OfflineIcon = WifiOff;
  readonly RetryIcon   = RefreshCw;
  readonly FileIcon    = FileText;
  readonly ChevronIcon = ChevronRight;

  rooms: ChatRoom[] = [];
  messages: ChatMessage[] = [];
  selectedRoom: ChatRoom | null = null;
  newMessage = '';
  isLoadingRooms = true;
  isLoadingMsgs  = false;
  hasError       = false;
  searchQuery    = '';
  isMobile       = window.innerWidth <= 640;

  roomRequest: RoomRequest | null = null;
  selectedBailId: number | null = null;

  private sub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    public chatService: ChatService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 640;
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.loadRooms(() => this.handleRoomQueryParam());

    this.sub = this.chatService.newMessage$.subscribe(msg => {
      if (!this.selectedRoom) return;
      const alreadyPresent = this.messages.some(m => m.id === msg.id);
      if (!alreadyPresent) {
        this.messages = [...this.messages, msg];
        this.cdr.detectChanges();
        this.scrollToBottom();
        if (msg.sender !== this.currentUserId) {
          this.markRoomAsRead(this.selectedRoom.id, [msg.id]);
        }
      }
    });

    this.routeSub = this.route.queryParamMap.subscribe(() => {
      if (!this.isLoadingRooms) this.handleRoomQueryParam();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.chatService.disconnectRoom();
  }

  private handleRoomQueryParam() {
    const params = this.route.snapshot.queryParamMap;
    const roomId = params.get('roomId');
    const userId = params.get('userId');

    if (roomId) {
      const existing = this.rooms.find(x => String(x.id) === String(roomId));
      if (existing) {
        this.selectRoom(existing);
      } else {
        this.http.get<ChatRoom>(`${environment.apiUrl}/chats/${roomId}/`).subscribe({
          next: (room) => {
            if (!this.rooms.find(r => r.id === room.id)) this.rooms = [room, ...this.rooms];
            this.selectRoom(room);
            this.cdr.detectChanges();
          },
          error: () => this.toast.error('Conversation introuvable.')
        });
      }
    } else if (userId) {
      const existingByUser = this.rooms.find(r => String(r.other_user_id) === String(userId));
      if (existingByUser) {
        this.selectRoom(existingByUser);
      } else {
        this.chatService.getOrCreateRoom(Number(userId)).subscribe({
          next: (room) => {
            if (!this.rooms.find(r => r.id === room.id)) this.rooms = [room, ...this.rooms];
            this.selectRoom(room);
            this.cdr.detectChanges();
          },
          error: () => this.toast.error("Impossible d'ouvrir la conversation.")
        });
      }
    }
  }

  loadRooms(callback?: () => void) {
    this.isLoadingRooms = true;
    this.hasError = false;
    this.chatService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.isLoadingRooms = false;
        this.cdr.detectChanges();
        callback?.();
      },
      error: () => {
        this.isLoadingRooms = false;
        this.hasError = true;
        this.cdr.detectChanges();
        callback?.();
      }
    });
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom = room;
    this.roomRequest  = null;
    this.isLoadingMsgs = true;
    this.messages = [];
    this.cdr.detectChanges();

    this.chatService.connectToRoom(room.id);

    this.chatService.getMessages(room.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoadingMsgs = false;
        this.cdr.detectChanges();
        this.scrollToBottom();

        const unreadIds = msgs
          .filter(m => !m.is_read && m.sender !== this.currentUserId)
          .map(m => m.id);
        if (unreadIds.length > 0) this.markRoomAsRead(room.id, unreadIds);
      },
      error: () => {
        this.isLoadingMsgs = false;
        this.cdr.detectChanges();
        this.toast.error('Impossible de charger les messages.');
      }
    });

    this.http.get<RoomRequest[]>(
      `${environment.apiUrl}/reservations/?other_user=${room.other_user_id}`
    ).subscribe({
      next: (reqs) => {
        if (reqs?.length) { this.roomRequest = reqs[0]; this.cdr.detectChanges(); }
      },
      error: () => {}
    });
  }

  private markRoomAsRead(roomId: number, messageIds: number[]) {
    const room = this.rooms.find(r => r.id === roomId);
    if (room && room.unread_count > 0) {
      room.unread_count = 0;
      this.rooms = [...this.rooms];
      this.cdr.detectChanges();
    }
    const sent = this.chatService.markAsReadWs(messageIds);
    if (!sent) {
      this.http.post(
        `${environment.apiUrl}/chats/${roomId}/mark-read/`,
        { message_ids: messageIds }
      ).subscribe({ error: () => {} });
    }
  }


  // messages.component.ts

// Enrichir sendMessage pour injecter le contexte de la room si dispo
  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom) return;
    const content = this.newMessage.trim();
    this.newMessage = '';

    setTimeout(() => {
      const ta = document.querySelector('.chat-textarea') as HTMLTextAreaElement;
      if (ta) ta.style.height = 'auto';
    }, 0);

    // Contexte à attacher au message si une demande est liée
    const ctx = this.roomRequest ? {
      context_type:     this.roomRequest.status === 'accepted' ? 'bail_signed' : 'reservation_request',
      context_property: this.roomRequest.property_title,
      context_bail_id:  this.roomRequest.bail_id ?? undefined,
      context_source:   'Depuis : section Demandes',
    } : undefined;

    const sent = this.chatService.sendMessageWs(content, ctx);
    if (!sent) {
      this.chatService.sendMessageHttp(this.selectedRoom.id, content, ctx).subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        error: () => this.toast.error("Impossible d'envoyer le message.")
      });
    }
  }


  sendOnEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /** Auto-resize du textarea selon le contenu */
  autoResize(event: Event) {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  get filteredRooms() {
    if (!this.searchQuery) return this.rooms;
    return this.rooms.filter(r =>
      r.other_user_name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get currentUserId() { return this.chatService.authService.getCurrentUser()?.id; }

  scrollToBottom() {
    setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
