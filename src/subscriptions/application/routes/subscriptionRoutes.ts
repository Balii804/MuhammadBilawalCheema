import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { asyncHandler } from '../../../shared/http/asyncHandler';

export function createSubscriptionRoutes(controller: SubscriptionController): Router {
  const router = Router();

  router.post('/', asyncHandler((req, res) => controller.createSubscription(req, res)));
  router.get('/', asyncHandler((req, res) => controller.getUserSubscriptions(req, res)));
  router.post('/:id/cancel', asyncHandler((req, res) => controller.cancelSubscription(req, res)));
  router.post('/:id/renew', asyncHandler((req, res) => controller.renewSubscription(req, res)));

  return router;
}
