import { InsufficientQuotaError } from '../../../shared/errors/DomainError';
import { getCurrentMonth } from '../../../shared/utils/date';
import { IUsageRepository } from '../repositories/IUsageRepository';
import { UserMonthlyUsage } from '../entities/UserMonthlyUsage';

export interface UsageDecision {
  type: 'FREE' | 'SUBSCRIPTION';
  subscriptionId?: string;
  remainingFreeMessages?: number;
}

export class UsageService {
  private readonly FREE_MESSAGES_PER_MONTH = 3;

  constructor(private readonly usageRepository: IUsageRepository) {}

  /**
   * Determines if a user can send a message and which quota to use
   */
  async checkAndReserveUsage(
    userId: string,
    subscriptionService: {
      findActiveBundleWithQuota: (userId: string) => Promise<{ id: string } | null>;
    }
  ): Promise<UsageDecision> {
    const currentMonth = getCurrentMonth();
    let monthlyUsage = await this.usageRepository.findByUserAndMonth(userId, currentMonth);

    // Initialize monthly usage if it doesn't exist
    if (!monthlyUsage) {
      monthlyUsage = await this.usageRepository.create({
        userId,
        month: currentMonth,
        freeMessagesUsed: 0,
      });
    }

    // Check if free quota is available
    if (monthlyUsage.freeMessagesUsed < this.FREE_MESSAGES_PER_MONTH) {
      const remaining = this.FREE_MESSAGES_PER_MONTH - monthlyUsage.freeMessagesUsed - 1;
      return {
        type: 'FREE',
        remainingFreeMessages: remaining,
      };
    }

    // Free quota exhausted, check for active subscription bundle
    const activeBundle = await subscriptionService.findActiveBundleWithQuota(userId);

    if (!activeBundle) {
      throw new InsufficientQuotaError(
        'You have exhausted your free monthly quota and do not have an active subscription bundle. Please subscribe to continue using the service.',
        { userId, currentMonth }
      );
    }

    return {
      type: 'SUBSCRIPTION',
      subscriptionId: activeBundle.id,
      remainingFreeMessages: 0,
    };
  }

  /**
   * Consumes a free message from monthly quota
   */
  async consumeFreeMessage(userId: string): Promise<void> {
    const currentMonth = getCurrentMonth();
    let monthlyUsage = await this.usageRepository.findByUserAndMonth(userId, currentMonth);

    if (!monthlyUsage) {
      monthlyUsage = await this.usageRepository.create({
        userId,
        month: currentMonth,
        freeMessagesUsed: 0,
      });
    }

    await this.usageRepository.update(monthlyUsage.id, monthlyUsage.freeMessagesUsed + 1);
  }
}
