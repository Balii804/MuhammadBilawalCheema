import { ChatMessage } from '../entities/ChatMessage';
import { IChatMessageRepository } from '../repositories/IChatMessageRepository';
import { UsageService } from './UsageService';
import { MockOpenAIClient } from '../../infrastructure/mockOpenAI/MockOpenAIClient';

export interface ChatResponse {
  question: string;
  answer: string;
  tokensUsed: number;
  timestamp: Date;
  remainingFreeMessages: number;
  usedQuotaType: 'FREE' | 'SUBSCRIPTION';
  subscriptionId?: string;
}

export class ChatService {
  constructor(
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly usageService: UsageService,
    private readonly openAIClient: MockOpenAIClient,
    private readonly subscriptionService: {
      findActiveBundleWithQuota: (userId: string) => Promise<{ id: string } | null>;
      consumeMessage: (subscriptionId: string) => Promise<void>;
    }
  ) {}

  async askQuestion(userId: string, question: string): Promise<ChatResponse> {
    // Check and reserve usage
    const usageDecision = await this.usageService.checkAndReserveUsage(
      userId,
      this.subscriptionService
    );

    // Generate AI response (with simulated delay)
    const { answer, tokens } = await this.openAIClient.generateAnswer(question);

    // Consume the quota
    if (usageDecision.type === 'FREE') {
      await this.usageService.consumeFreeMessage(userId);
    } else if (usageDecision.subscriptionId) {
      await this.subscriptionService.consumeMessage(usageDecision.subscriptionId);
    }

    // Store the message
    const message = await this.chatMessageRepository.create({
      userId,
      question,
      answer,
      tokensUsed: tokens,
      createdAt: new Date(),
    });

    return {
      question: message.question,
      answer: message.answer,
      tokensUsed: message.tokensUsed,
      timestamp: message.createdAt,
      remainingFreeMessages: usageDecision.remainingFreeMessages ?? 0,
      usedQuotaType: usageDecision.type,
      subscriptionId: usageDecision.subscriptionId,
    };
  }
}
