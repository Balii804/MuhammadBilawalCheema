import { PrismaClient } from '@prisma/client';
import { UserMonthlyUsage } from '../../domain/entities/UserMonthlyUsage';
import { IUsageRepository } from '../../domain/repositories/IUsageRepository';
import { ensureUserExists } from '../../../shared/utils/user';

export class UsageRepository implements IUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndMonth(userId: string, month: string): Promise<UserMonthlyUsage | null> {
    const usage = await this.prisma.userMonthlyUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    if (!usage) return null;

    return new UserMonthlyUsage(
      usage.id,
      usage.userId,
      usage.month,
      usage.freeMessagesUsed,
      usage.createdAt,
      usage.updatedAt
    );
  }

  async create(
    usage: Omit<UserMonthlyUsage, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserMonthlyUsage> {
    // Ensure user exists before creating usage record
    await ensureUserExists(usage.userId);

    const created = await this.prisma.userMonthlyUsage.create({
      data: {
        userId: usage.userId,
        month: usage.month,
        freeMessagesUsed: usage.freeMessagesUsed,
      },
    });

    return new UserMonthlyUsage(
      created.id,
      created.userId,
      created.month,
      created.freeMessagesUsed,
      created.createdAt,
      created.updatedAt
    );
  }

  async update(id: string, freeMessagesUsed: number): Promise<UserMonthlyUsage> {
    const updated = await this.prisma.userMonthlyUsage.update({
      where: { id },
      data: { freeMessagesUsed },
    });

    return new UserMonthlyUsage(
      updated.id,
      updated.userId,
      updated.month,
      updated.freeMessagesUsed,
      updated.createdAt,
      updated.updatedAt
    );
  }
}
