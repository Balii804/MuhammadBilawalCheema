import express from 'express';
import { json } from 'express';
import { prisma } from './shared/db/prisma';
import { errorHandler } from './shared/http/errorHandler';

// Chat module
import { ChatMessageRepository } from './chat/infrastructure/repositories/ChatMessageRepository';
import { UsageRepository } from './chat/infrastructure/repositories/UsageRepository';
import { UsageService } from './chat/domain/services/UsageService';
import { ChatService } from './chat/domain/services/ChatService';
import { MockOpenAIClient } from './chat/infrastructure/mockOpenAI/MockOpenAIClient';
import { ChatController } from './chat/application/controllers/ChatController';
import { createChatRoutes } from './chat/application/routes/chatRoutes';

// Subscription module
import { SubscriptionRepository } from './subscriptions/infrastructure/repositories/SubscriptionRepository';
import { SubscriptionService } from './subscriptions/domain/services/SubscriptionService';
import { SubscriptionController } from './subscriptions/application/controllers/SubscriptionController';
import { createSubscriptionRoutes } from './subscriptions/application/routes/subscriptionRoutes';

const app = express();

app.use(json());

// Initialize repositories
const chatMessageRepository = new ChatMessageRepository(prisma);
const usageRepository = new UsageRepository(prisma);
const subscriptionRepository = new SubscriptionRepository(prisma);

// Initialize services
const subscriptionService = new SubscriptionService(subscriptionRepository);
const usageService = new UsageService(usageRepository);
const openAIClient = new MockOpenAIClient();

// Chat service needs subscription service for quota checking
const chatService = new ChatService(
  chatMessageRepository,
  usageService,
  openAIClient,
  {
    findActiveBundleWithQuota: (userId: string) =>
      subscriptionService.findActiveBundleWithQuota(userId),
    consumeMessage: (subscriptionId: string) =>
      subscriptionService.consumeMessage(subscriptionId),
  }
);

// Initialize controllers
const chatController = new ChatController(chatService, chatMessageRepository);
const subscriptionController = new SubscriptionController(subscriptionService);

// Register routes
app.use('/api/chat', createChatRoutes(chatController));
app.use('/api/subscriptions', createSubscriptionRoutes(subscriptionController));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Health check: http://localhost:${PORT}/health`);
  // eslint-disable-next-line no-console
  console.log(`API endpoints:`);
  // eslint-disable-next-line no-console
  console.log(`  POST /api/chat`);
  // eslint-disable-next-line no-console
  console.log(`  GET  /api/chat/history?userId=...`);
  // eslint-disable-next-line no-console
  console.log(`  POST /api/subscriptions`);
  // eslint-disable-next-line no-console
  console.log(`  GET  /api/subscriptions?userId=...`);
  // eslint-disable-next-line no-console
  console.log(`  POST /api/subscriptions/:id/cancel`);
  // eslint-disable-next-line no-console
  console.log(`  POST /api/subscriptions/:id/renew`);
});

