import { prisma } from '../db/prisma';

/**
 * Ensures a user exists in the database, creating it if necessary
 */
export async function ensureUserExists(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {}, // No update needed if exists
    create: {
      id: userId,
      email: `${userId}@task.local`, // Unique placeholder email per user
    },
  });
}
