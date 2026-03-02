export function randomBoolean(probabilityTrue: number): boolean {
  return Math.random() < probabilityTrue;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates payment failure with a 20% probability
 * @returns true if payment failed, false if payment succeeded
 */
export function simulatePaymentFailure(): boolean {
  return randomBoolean(0.2); // 20% failure rate
}

