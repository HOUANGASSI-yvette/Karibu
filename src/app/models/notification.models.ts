/**
 * Notification Models - Interfaces partagées pour les notifications
 */

export interface Notification {
  id:                  number;
  type:                NotificationType;
  title:               string;
  message:             string;
  is_read:             boolean;
  created_at:          string;
  read_at?:            string;
  related_user?:       number;
  related_object_id?:  number;
  related_object_type?: string;
}

export type NotificationType = 
  | 'new_message' 
  | 'booking_request' 
  | 'booking_confirmed' 
  | 'booking_canceled';

/**
 * Messages WebSocket notification reçus du serveur
 */
export interface WSNotification {
  type: 'notification';
  notification_type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  related_object_id?: number;
  related_object_type?: string;
}
