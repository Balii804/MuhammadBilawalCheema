export enum SubscriptionTier {
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export class SubscriptionBundle {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tier: SubscriptionTier,
    public readonly billingCycle: BillingCycle,
    public readonly maxMessages: number | null, // null means unlimited
    public readonly messagesUsed: number,
    public readonly price: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly renewalDate: Date,
    public readonly autoRenew: boolean,
    public readonly status: SubscriptionStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if subscription is currently active
   */
  isActive(now: Date = new Date()): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate
    );
  }

  /**
   * Check if subscription has remaining quota
   */
  hasQuota(): boolean {
    return this.maxMessages === null || this.messagesUsed < this.maxMessages;
  }

  /**
   * Get remaining messages
   */
  getRemainingMessages(): number | null {
    if (this.maxMessages === null) return null; // unlimited
    return Math.max(0, this.maxMessages - this.messagesUsed);
  }
}
