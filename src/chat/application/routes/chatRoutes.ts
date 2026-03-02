import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { asyncHandler } from '../../../shared/http/asyncHandler';

export function createChatRoutes(chatController: ChatController): Router {
  const router = Router();

  router.post('/', asyncHandler((req, res) => chatController.askQuestion(req, res)));
  router.get('/history', asyncHandler((req, res) => chatController.getHistory(req, res)));

  return router;
}
