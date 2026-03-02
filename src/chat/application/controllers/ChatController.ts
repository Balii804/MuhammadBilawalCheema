import { Request, Response } from 'express';
import { ChatService } from '../../domain/services/ChatService';
import { ChatRequestDTO, ChatResponseDTO, ChatHistoryResponseDTO } from '../dto/ChatDTO';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';

export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessageRepository: IChatMessageRepository
  ) {}

  async askQuestion(req: Request, res: Response): Promise<void> {
    const { userId, question }: ChatRequestDTO = req.body;

    if (!userId || !question) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId and question are required',
        },
      });
      return;
    }

    const response = await this.chatService.askQuestion(userId, question);

    const dto: ChatResponseDTO = {
      question: response.question,
      answer: response.answer,
      tokensUsed: response.tokensUsed,
      timestamp: response.timestamp.toISOString(),
      remainingFreeMessages: response.remainingFreeMessages,
      usedQuotaType: response.usedQuotaType,
      subscriptionId: response.subscriptionId,
    };

    res.status(200).json(dto);
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId query parameter is required',
        },
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const messages = await this.chatMessageRepository.findByUserId(userId, limit);

    const dto: ChatHistoryResponseDTO = {
      messages: messages.map((m) => ({
        id: m.id,
        question: m.question,
        answer: m.answer,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    res.status(200).json(dto);
  }
}
