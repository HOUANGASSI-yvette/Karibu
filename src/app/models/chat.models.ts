/**
 * Chat Models - Interfaces partagées pour le système de chat
 */

export interface ChatRoom {
  id:              number;
  other_user_id:   number;
  other_user_name: string;
  last_message?:   string;
  last_message_at?: string;
  unread_count:    number;
  updated_at:      string;
  booking_id?:     number;
  listing_id?:     number;
}

export interface ChatMessage {
  id:          number;
  sender:      number;
  sender_name: string;
  content:     string;
  is_read:     boolean;
  read_at?:    string;
  created_at:  string;
  updated_at?: string;

  // Contexte optionnel (réservation, bail, etc.)
  context_type?:     string;  // 'reservation_request' | 'bail_signed' | 'system'
  context_property?: string;
  context_bail_id?:  number;
  context_source?:   string;

  // Pièces jointes
  attachments?:  MessageAttachment[];
}

export interface MessageAttachment {
  id:            number;
  file:          string;          // URL du fichier
  file_type:     FileType;
  file_size:     number;          // En bytes
  mime_type:     string;
  original_name: string;
  thumbnail?:    string;          // URL miniature (pour images)
  uploaded_at:   string;
}

export type FileType = 'image' | 'document' | 'video' | 'audio';

export interface UserStatus {
  user_id:  number;
  status:   'online' | 'offline';
  last_seen?: string;
}

export interface TypingStatus {
  user_id:   number;
  is_typing: boolean;
}

/**
 * Message WebSocket envoyés au serveur
 */
export interface WSSendMessage {
  type: 'chat_message';
  content: string;
  context_type?: string;
  context_property?: string;
  context_bail_id?: number;
  context_source?: string;
}

export interface WSMarkAsRead {
  type: 'mark_as_read';
  message_ids: number[];
}

export interface WSTyping {
  type: 'typing';
  is_typing: boolean;
}

/**
 * Messages WebSocket reçus du serveur
 */
export interface WSChatMessage {
  type: 'chat_message';
  message: ChatMessage;
}

export interface WSFileMessage {
  type: 'file_message';
  attachment_id: number;
  message: ChatMessage;
}

export interface WSUserTyping {
  type: 'user_typing';
  user_id: number;
  is_typing: boolean;
}

export interface WSUserStatus {
  type: 'user_status';
  user_id: number;
  status: 'online' | 'offline';
}

export interface WSError {
  type: 'error';
  message: string;
}

export type WSMessage = 
  | WSChatMessage 
  | WSFileMessage 
  | WSUserTyping 
  | WSUserStatus 
  | WSError;
