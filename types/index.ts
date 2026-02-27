export interface User {
  id: string;
  email: string;
  username: string;
  unique_id: string; // XXX-XXX-XXX format
  avatar_url?: string;
  created_at: string;
  last_seen?: string;
}

export interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  connected_user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  image_url?: string;
  message_type: 'text' | 'image';
  created_at: string;
  read_at?: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  last_message_at: string;
  created_at: string;
  other_user?: User;
  unread_count?: number;
}
