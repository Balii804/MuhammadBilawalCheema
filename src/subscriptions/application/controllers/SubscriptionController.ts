import { Request, Response } from 'express';
import { SubscriptionService } from '../../domain/services/SubscriptionService';
import {
  CreateSubscriptionRequestDTO,
  SubscriptionResponseDTO,
  RenewalResponseDTO,
} from '../dto/SubscriptionDTO';

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async createSubscription(req: Request, res: Response): Promise<void> {
    const { userId, tier, billingCycle, autoRenew }: CreateSubscriptionRequestDTO = req.body;

    if (!userId || !tier || !billingCycle || autoRenew === undefined) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId, tier, billingCycle, and autoRenew are required',
        },
      });
      return;
    }

    const subscription = await this.subscriptionService.createSubscription(
      userId,
      tier,
      billingCycle,
      autoRenew
    );

    const dto: SubscriptionResponseDTO = this.mapToDTO(subscription);
    res.status(201).json(dto);
  }

  async getUserSubscriptions(req: Request, res: Response): Promise<void> {
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

    const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);
    const dtos: SubscriptionResponseDTO[] = subscriptions.map((s) => this.mapToDTO(s));

    res.status(200).json({ subscriptions: dtos });
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const subscription = await this.subscriptionService.cancelSubscription(id);
    const dto: SubscriptionResponseDTO = this.mapToDTO(subscription);

    res.status(200).json({
      message: 'Subscription cancelled successfully. It will remain active until the end of the billing cycle.',
      subscription: dto,
    });
  }

  async renewSubscription(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await this.subscriptionService.processRenewal(id);

    const dto: RenewalResponseDTO = {
      success: result.success,
      message: result.success
        ? 'Subscription renewed successfully'
        : 'Renewal failed. Payment may have failed or subscription is not eligible for renewal.',
      newBundle: result.newBundle ? this.mapToDTO(result.newBundle) : undefined,
    };

    res.status(result.success ? 200 : 400).json(dto);
  }

  private mapToDTO(subscription: any): SubscriptionResponseDTO {
    return {
      id: subscription.id,
      userId: subscription.userId,
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      maxMessages: subscription.maxMessages,
      messagesUsed: subscription.messagesUsed,
      price: subscription.price,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      renewalDate: subscription.renewalDate.toISOString(),
      autoRenew: subscription.autoRenew,
      status: subscription.status,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}
