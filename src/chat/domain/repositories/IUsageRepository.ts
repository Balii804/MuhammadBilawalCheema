import { UserMonthlyUsage } from '../entities/UserMonthlyUsage';

export interface IUsageRepository {
  findByUserAndMonth(userId: string, month: string): Promise<UserMonthlyUsage | null>;
  create(usage: Omit<UserMonthlyUsage, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserMonthlyUsage>;
  update(id: string, freeMessagesUsed: number): Promise<UserMonthlyUsage>;
}
