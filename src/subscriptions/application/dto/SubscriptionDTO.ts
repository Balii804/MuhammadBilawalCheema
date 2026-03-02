import { SubscriptionTier, BillingCycle, SubscriptionStatus } from '../../domain/entities/SubscriptionBundle';

export interface CreateSubscriptionRequestDTO {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenew: boolean;
}

export interface SubscriptionResponseDTO {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number | null;
  messagesUsed: number;
  price: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  autoRenew: boolean;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalResponseDTO {
  success: boolean;
  message: string;
  newBundle?: SubscriptionResponseDTO;
}
