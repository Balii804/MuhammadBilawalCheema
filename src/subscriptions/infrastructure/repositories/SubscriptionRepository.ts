import { PrismaClient } from '@prisma/client';
import {
  SubscriptionBundle,
  SubscriptionTier,
  BillingCycle,
  SubscriptionStatus,
} from '../../domain/entities/SubscriptionBundle';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { ensureUserExists } from '../../../shared/utils/user';

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    bundle: Omit<SubscriptionBundle, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionBundle> {
    // Ensure user exists before creating subscription
    await ensureUserExists(bundle.userId);

    const created = await this.prisma.subscriptionBundle.create({
      data: {
        userId: bundle.userId,
        tier: bundle.tier,
        billingCycle: bundle.billingCycle,
        maxMessages: bundle.maxMessages,
        messagesUsed: bundle.messagesUsed,
        price: bundle.price,
        startDate: bundle.startDate,
        endDate: bundle.endDate,
        renewalDate: bundle.renewalDate,
        autoRenew: bundle.autoRenew,
        status: bundle.status,
      },
    });

    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<SubscriptionBundle | null> {
    const bundle = await this.prisma.subscriptionBundle.findUnique({
      where: { id },
    });

    return bundle ? this.mapToDomain(bundle) : null;
  }

  async findByUserId(userId: string): Promise<SubscriptionBundle[]> {
    const bundles = await this.prisma.subscriptionBundle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return bundles.map((b) => this.mapToDomain(b));
  }

  async findActiveBundlesWithQuota(userId: string, now: Date = new Date()): Promise<SubscriptionBundle[]> {
    const bundles = await this.prisma.subscriptionBundle.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    return bundles
      .map((b) => this.mapToDomain(b))
      .filter((bundle) => bundle.hasQuota())
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime()); // Latest end date first
  }

  async update(
    id: string,
    updates: Partial<SubscriptionBundle>
  ): Promise<SubscriptionBundle> {
    const updated = await this.prisma.subscriptionBundle.update({
      where: { id },
      data: {
        ...(updates.messagesUsed !== undefined && { messagesUsed: updates.messagesUsed }),
        ...(updates.startDate !== undefined && { startDate: updates.startDate }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate }),
        ...(updates.renewalDate !== undefined && { renewalDate: updates.renewalDate }),
        ...(updates.autoRenew !== undefined && { autoRenew: updates.autoRenew }),
        ...(updates.status !== undefined && { status: updates.status }),
      },
    });

    return this.mapToDomain(updated);
  }

  private mapToDomain(bundle: any): SubscriptionBundle {
    return new SubscriptionBundle(
      bundle.id,
      bundle.userId,
      bundle.tier as SubscriptionTier,
      bundle.billingCycle as BillingCycle,
      bundle.maxMessages,
      bundle.messagesUsed,
      Number(bundle.price),
      bundle.startDate,
      bundle.endDate,
      bundle.renewalDate,
      bundle.autoRenew,
      bundle.status as SubscriptionStatus,
      bundle.createdAt,
      bundle.updatedAt
    );
  }
}
