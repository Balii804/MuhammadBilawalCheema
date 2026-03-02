import { ChatMessage } from '../entities/ChatMessage';

export interface IChatMessageRepository {
  create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  findByUserId(userId: string, limit?: number): Promise<ChatMessage[]>;
}
