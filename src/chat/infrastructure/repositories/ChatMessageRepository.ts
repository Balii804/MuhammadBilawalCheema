import { PrismaClient } from '@prisma/client';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ensureUserExists } from '../../../shared/utils/user';

export class ChatMessageRepository implements IChatMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    // Ensure user exists before creating message
    await ensureUserExists(message.userId);

    const created = await this.prisma.chatMessage.create({
      data: {
        userId: message.userId,
        question: message.question,
        answer: message.answer,
        tokensUsed: message.tokensUsed,
      },
    });

    return new ChatMessage(
      created.id,
      created.userId,
      created.question,
      created.answer,
      created.tokensUsed,
      created.createdAt
    );
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map(
      (m) =>
        new ChatMessage(m.id, m.userId, m.question, m.answer, m.tokensUsed, m.createdAt)
    );
  }
}
