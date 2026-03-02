import { SubscriptionBundle } from '../entities/SubscriptionBundle';

export interface ISubscriptionRepository {
  create(bundle: Omit<SubscriptionBundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionBundle>;
  findById(id: string): Promise<SubscriptionBundle | null>;
  findByUserId(userId: string): Promise<SubscriptionBundle[]>;
  findActiveBundlesWithQuota(userId: string, now?: Date): Promise<SubscriptionBundle[]>;
  update(id: string, updates: Partial<SubscriptionBundle>): Promise<SubscriptionBundle>;
}
