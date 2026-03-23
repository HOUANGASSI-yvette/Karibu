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
    public authService: AuthService
  ) {}

  // ── HTTP ──────────────────────────────────────────────────

  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.BASE}/`).pipe(
      tap(() => this.isAvailable.set(true)),
      catchError(err => {
        this.isAvailable.set(false);
        return throwError(() => err);
      })
    );
  }

  getOrCreateRoom(userId: number): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${this.BASE}/create/${userId}/`);
  }

  getMessages(roomId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.BASE}/${roomId}/messages/`);
  }

  sendMessageHttp(roomId: number, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.BASE}/${roomId}/messages/`, { content });
  }

  getUserStatus(userId: number): Observable<any> {
    return this.http.get(`${this.BASE}/status/${userId}/`);
  }

  // ── WebSocket ─────────────────────────────────────────────

  connectToRoom(roomId: number) {
    this.disconnectRoom();
    const token = this.authService.getAccessToken();
    const wsUrl = `${environment.wsUrl}/ws/chat/${roomId}/?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected.set(true);
        this.isAvailable.set(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message') {
            this.newMessage$.next(data.message);
          }
        } catch {}
      };

      this.ws.onerror = () => {
        this.isConnected.set(false);
      };

      this.ws.onclose = () => {
        this.isConnected.set(false);
      };

    } catch {
      this.isConnected.set(false);
      this.isAvailable.set(false);
    }
  }

  sendMessageWs(content: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat_message', content }));
      return true;
    }
    return false;
  }

  disconnectRoom() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected.set(false);
  }
}
