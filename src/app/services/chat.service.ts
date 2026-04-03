  import { Injectable, signal } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, Subject, throwError } from 'rxjs';
  import { catchError, tap } from 'rxjs/operators';
  import { environment } from '../../environments/environment';
  import { AuthService } from './auth.service';
  import {
    ChatRoom,
    ChatMessage,
    MessageAttachment,
    UserStatus,
    TypingStatus
  } from '../models/chat.models';

  @Injectable({ providedIn: 'root' })
  export class ChatService {

    private readonly BASE = `${environment.apiUrl}/chat`;
    private ws: WebSocket | null = null;
    private currentRoomId: number | null = null;

    newMessage$   = new Subject<ChatMessage>();
    userTyping$   = new Subject<TypingStatus>();
    userStatus$   = new Subject<UserStatus>();
    fileMessage$  = new Subject<{attachment_id: number, message: ChatMessage}>();

    isConnected     = signal(false);
    isAvailable     = signal(true);
    otherUserStatus = signal<'online' | 'offline'>('offline');

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

    connectToRoom(roomId: number, otherUserId?: number) {
      this.disconnectRoom();
      this.currentRoomId = roomId;

      const token = this.authService.getAccessToken();
      const wsUrl = `${environment.wsUrl}/ws/chat/${roomId}/?token=${token}`;

      // Fetch initial status si otherUserId fourni
      if (otherUserId) {
        this.getUserStatus(otherUserId).subscribe({
          next: (status) => {
            this.otherUserStatus.set(status.is_online ? 'online' : 'offline');
          },
          error: () => this.otherUserStatus.set('offline')
        });
      }

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

            switch (data.type) {
              case 'chat_message':
                // { type: 'chat_message', message: { id, sender, sender_name, content, created_at, is_read } }
                this.newMessage$.next(data.message as ChatMessage);
                break;

              case 'file_message':
                // { type: 'file_message', message_id, attachment_id, sender, sender_name, file_type, file_url, etc. }
                const fileMessage: ChatMessage = {
                  id: data.message_id,
                  sender: data.sender,
                  sender_name: data.sender_name,
                  content: `📎 ${data.original_name}`,
                  created_at: data.created_at,
                  is_read: false,
                  attachments: [{
                    id: data.attachment_id,
                    file: data.file_url,
                    file_type: data.file_type,
                    file_size: data.file_size,
                    mime_type: '', // Pas fourni par le WS
                    original_name: data.original_name,
                    thumbnail: data.thumbnail_url,
                    uploaded_at: data.created_at
                  }],
                  context_type: 'file_upload'
                };
                
                this.fileMessage$.next({
                  attachment_id: data.attachment_id,
                  message: fileMessage
                });
                this.newMessage$.next(fileMessage);
                break;

              case 'user_typing':
                // { type: 'user_typing', user_id: 5, is_typing: true }
                this.userTyping$.next({
                  user_id: data.user_id,
                  is_typing: data.is_typing
                });
                break;

              case 'user_status':
                // { type: 'user_status', user_id: 5, status: 'online' }
                this.userStatus$.next({
                  user_id: data.user_id,
                  status: data.status
                });
                // Mettre à jour le signal si c'est l'autre user
                if (otherUserId && data.user_id === otherUserId) {
                  this.otherUserStatus.set(data.status);
                }
                break;

              case 'error':
                console.error('WS error from server:', data.message);
                break;
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

    /** Envoie l'indicateur de frappe via WS. */
    sendTypingIndicator(isTyping: boolean): boolean {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
        return true;
      }
      return false;
    }

    /** Upload un fichier dans une room. */
    uploadFile(roomId: number, file: File, messageContent?: string): Observable<any> {
      const formData = new FormData();
      formData.append('file', file);
      if (messageContent) formData.append('message_content', messageContent);

      return this.http.post(`${this.BASE}/${roomId}/upload/`, formData);
    }

    /** Télécharge un fichier. */
    downloadFile(attachmentId: number): Observable<Blob> {
      return this.http.get(`${this.BASE}/files/${attachmentId}/`, {
        responseType: 'blob'
      });
    }

    /** Supprime un fichier. */
    deleteFile(attachmentId: number): Observable<any> {
      return this.http.delete(`${this.BASE}/files/${attachmentId}/delete/`);
    }

    /** Marque des messages comme lus via HTTP (fallback). */
    markAsReadHttp(roomId: number, messageIds: number[]): Observable<any> {
      return this.http.post(`${this.BASE}/${roomId}/mark-read/`, {
        message_ids: messageIds
      });
    }

    disconnectRoom() {
      if (this.ws) { this.ws.close(); this.ws = null; }
      this.isConnected.set(false);
      this.otherUserStatus.set('offline');
      this.currentRoomId = null;
    }
  }

  // Re-export pour compatibilité (temporaire)
  export type { ChatRoom, ChatMessage, MessageAttachment } from '../models/chat.models';
