export class UserMonthlyUsage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly month: string, // YYYY-MM format
    public readonly freeMessagesUsed: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
