import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { ChatService, ChatRoom, ChatMessage } from '../../services/chat.service';
import { ToastService } from '../../shared/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Send, Search, Circle, WifiOff, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './messages.html',
})
export class MessagesComponent implements OnInit, OnDestroy {

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  readonly SendIcon    = Send;
  readonly SearchIcon  = Search;
  readonly CircleIcon  = Circle;
  readonly OfflineIcon = WifiOff;
  readonly RetryIcon   = RefreshCw;

  rooms:         ChatRoom[]    = [];
  messages:      ChatMessage[] = [];
  selectedRoom:  ChatRoom | null = null;
  newMessage     = '';
  isLoadingRooms = true;
  isLoadingMsgs  = false;
  hasError       = false;
  searchQuery    = '';

  private sub?: Subscription;

  constructor(
    public chatService: ChatService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadRooms();
    this.sub = this.chatService.newMessage$.subscribe(msg => {
      if (this.selectedRoom) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.chatService.disconnectRoom();
  }

  loadRooms() {
    this.isLoadingRooms = true;
    this.hasError       = false;

    this.chatService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms         = rooms;
        this.isLoadingRooms = false;
      },
      error: () => {
        this.isLoadingRooms = false;
        this.hasError       = true;
      }
    });
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom  = room;
    this.isLoadingMsgs = true;
    this.messages      = [];

    this.chatService.connectToRoom(room.id);

    this.chatService.getMessages(room.id).subscribe({
      next: (msgs) => {
        this.messages      = msgs;
        this.isLoadingMsgs = false;
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingMsgs = false;
        this.toast.error('Impossible de charger les messages.');
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom) return;
    const content   = this.newMessage.trim();
    this.newMessage = '';

    // Essaie WebSocket d'abord, fallback HTTP si pas connecté
    const sent = this.chatService.sendMessageWs(content);
    if (!sent) {
      this.chatService.sendMessageHttp(this.selectedRoom.id, content).subscribe({
        next: (msg) => {
          this.messages.push(msg);
          this.scrollToBottom();
        },
        error: () => this.toast.error('Impossible d\'envoyer le message.')
      });
    }
  }

  sendOnEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  get filteredRooms(): ChatRoom[] {
    if (!this.searchQuery) return this.rooms;
    return this.rooms.filter(r =>
      r.other_user_name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get currentUserId(): number {
    return this.chatService.authService.getCurrentUser()?.id;
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
