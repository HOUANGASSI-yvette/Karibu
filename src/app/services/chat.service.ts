  import { Injectable, signal } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, Subject, throwError } from 'rxjs';
  import { catchError, tap } from 'rxjs/operators';
  import { environment } from '../../environments/environment';
  import { AuthService } from './auth.service';

  export interface ChatRoom {
    id:              number;
    other_user_id:   number;
    other_user_name: string;
    last_message?:   string;
    unread_count:    number;
    updated_at:      string;
  }

  export interface ChatMessage {
    id:          number;
    sender:      number;
    sender_name: string;
    content:     string;
    is_read:     boolean;
    read_at?:    string;
    created_at:  string;

    context_type?:     string;  // 'reservation_request' | 'bail_signed' | 'system'
    context_property?: string;
    context_bail_id?:  number;
    context_source?:   string;
  }

  @Injectable({ providedIn: 'root' })
  export class ChatService {

    private readonly BASE = `${environment.apiUrl}/chats`;
    private ws: WebSocket | null = null;

    newMessage$  = new Subject<ChatMessage>();
    isConnected  = signal(false);
    isAvailable  = signal(true);

    constructor(
      private http: HttpClient,
      public authService: AuthService,
    ) {}

    getRooms(): Observable<ChatRoom[]> {
      return this.http.get<ChatRoom[]>(`${this.BASE}/`).pipe(
        tap(() => this.isAvailable.set(true)),
        catchError(err => { this.isAvailable.set(false); return throwError(() => err); })
      );
    }

    getOrCreateRoom(userId: number): Observable<ChatRoom> {
      return this.http.get<ChatRoom>(`${this.BASE}/create/${userId}/`);
    }

    getMessages(roomId: number): Observable<ChatMessage[]> {
      return this.http.get<ChatMessage[]>(`${this.BASE}/${roomId}/messages/`);
    }

    sendMessageHttp(roomId: number, content: string, ctx?: Partial<Pick<ChatMessage,
      'context_type'|'context_property'|'context_bail_id'|'context_source'
    >>): Observable<ChatMessage> {
      return this.http.post<ChatMessage>(
        `${this.BASE}/${roomId}/messages/`,
        { content, ...ctx }
      );
    }

    getUserStatus(userId: number): Observable<any> {
      return this.http.get(`${this.BASE}/status/${userId}/`);
    }

    connectToRoom(roomId: number) {
      this.disconnectRoom();
      const token = this.authService.getAccessToken();
      const wsUrl = `${environment.wsUrl}/ws/chat/${roomId}/?token=${token}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected.set(true);
          this.isAvailable.set(true);
          console.log(`WS connected to room ${roomId}`);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
              // { type: 'chat_message', message: { id, sender, sender_name, content, created_at, is_read } }
              this.newMessage$.next(data.message as ChatMessage);
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        this.ws.onerror  = () => this.isConnected.set(false);
        this.ws.onclose  = () => this.isConnected.set(false);

      } catch {
        this.isConnected.set(false);
        this.isAvailable.set(false);
      }
    }

    /** Envoie un message via WS. Retourne true si envoyé. */
    sendMessageWs(content: string, ctx?: Partial<Pick<ChatMessage,
      'context_type'|'context_property'|'context_bail_id'|'context_source'
    >>): boolean {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'chat_message', content, ...ctx }));
        return true;
      }
      return false;
    }


    /** Marque des messages comme lus via WS. Retourne true si envoyé. */
    markAsReadWs(messageIds: number[]): boolean {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'mark_as_read', message_ids: messageIds }));
        return true;
      }
      return false;
    }

    disconnectRoom() {
      if (this.ws) { this.ws.close(); this.ws = null; }
      this.isConnected.set(false);
    }
  }
