export interface ChatRequestDTO {
  userId: string;
  question: string;
}

export interface ChatResponseDTO {
  question: string;
  answer: string;
  tokensUsed: number;
  timestamp: string;
  remainingFreeMessages: number;
  usedQuotaType: 'FREE' | 'SUBSCRIPTION';
  subscriptionId?: string;
}

export interface ChatHistoryResponseDTO {
  messages: Array<{
    id: string;
    question: string;
    answer: string;
    tokensUsed: number;
    createdAt: string;
  }>;
}
