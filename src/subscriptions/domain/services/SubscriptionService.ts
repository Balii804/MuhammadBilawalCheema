import {
  SubscriptionBundle,
  SubscriptionTier,
  BillingCycle,
  SubscriptionStatus,
} from '../entities/SubscriptionBundle';
import { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import { NotFoundError } from '../../../shared/errors/DomainError';
import { addMonths, addYears } from '../../../shared/utils/date';
import { simulatePaymentFailure } from '../../../shared/utils/random';

export class SubscriptionService {
  private readonly TIER_CONFIG = {
    [SubscriptionTier.BASIC]: { maxMessages: 10, price: 10 },
    [SubscriptionTier.PRO]: { maxMessages: 100, price: 50 },
    [SubscriptionTier.ENTERPRISE]: { maxMessages: null, price: 200 },
  };

  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  /**
   * Create a new subscription bundle
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    autoRenew: boolean
  ): Promise<SubscriptionBundle> {
    const config = this.TIER_CONFIG[tier];
    const now = new Date();

    let endDate: Date;
    let renewalDate: Date;

    if (billingCycle === BillingCycle.MONTHLY) {
      endDate = addMonths(now, 1);
      renewalDate = endDate;
    } else {
      endDate = addYears(now, 1);
      renewalDate = endDate;
    }

    return this.subscriptionRepository.create({
      userId,
      tier,
      billingCycle,
      maxMessages: config.maxMessages,
      messagesUsed: 0,
      price: config.price,
      startDate: now,
      endDate,
      renewalDate,
      autoRenew,
      status: SubscriptionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Cancel a subscription (disables auto-renew, keeps active until end date)
   */
  async cancelSubscription(subscriptionId: string): Promise<SubscriptionBundle> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundError(`Subscription with id ${subscriptionId} not found`);
    }

    return this.subscriptionRepository.update(subscriptionId, {
      autoRenew: false,
      // Status remains ACTIVE until endDate
    });
  }

  /**
   * Find active bundle with quota for a user (used by chat service)
   */
  async findActiveBundleWithQuota(userId: string): Promise<{ id: string } | null> {
    const bundles = await this.subscriptionRepository.findActiveBundlesWithQuota(userId);

    if (bundles.length === 0) return null;

    // Return the bundle with the latest end date (latest remaining quota)
    return { id: bundles[0].id };
  }

  /**
   * Consume a message from a subscription bundle
   */
  async consumeMessage(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundError(`Subscription with id ${subscriptionId} not found`);
    }

    if (!subscription.hasQuota()) {
      throw new Error(`Subscription ${subscriptionId} has no remaining quota`);
    }

    await this.subscriptionRepository.update(subscriptionId, {
      messagesUsed: subscription.messagesUsed + 1,
    });
  }

  /**
   * Process auto-renewal for a subscription
   */
  async processRenewal(subscriptionId: string): Promise<{ success: boolean; newBundle?: SubscriptionBundle }> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundError(`Subscription with id ${subscriptionId} not found`);
    }

    if (!subscription.autoRenew || subscription.status !== SubscriptionStatus.ACTIVE) {
      return { success: false };
    }

    const now = new Date();
    if (now < subscription.renewalDate) {
      return { success: false }; // Not yet time to renew
    }

    // Simulate payment
    const paymentFailed = simulatePaymentFailure();

    if (paymentFailed) {
      // Mark subscription as inactive
      await this.subscriptionRepository.update(subscriptionId, {
        status: SubscriptionStatus.INACTIVE,
        autoRenew: false,
      });
      return { success: false };
    }

    // Payment succeeded - create new billing cycle
    // For simplicity, we update the existing subscription with new dates and reset usage
    // In production, you might want to create a new subscription record to preserve history
    const config = this.TIER_CONFIG[subscription.tier];
    let newEndDate: Date;
    let newRenewalDate: Date;

    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      newEndDate = addMonths(subscription.endDate, 1);
      newRenewalDate = newEndDate;
    } else {
      newEndDate = addYears(subscription.endDate, 1);
      newRenewalDate = newEndDate;
    }

    const renewed = await this.subscriptionRepository.update(subscriptionId, {
      startDate: subscription.endDate, // New cycle starts when old one ends
      endDate: newEndDate,
      renewalDate: newRenewalDate,
      messagesUsed: 0, // Reset usage for new billing cycle
    });

    return { success: true, newBundle: renewed };
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<SubscriptionBundle[]> {
    return this.subscriptionRepository.findByUserId(userId);
  }
}
