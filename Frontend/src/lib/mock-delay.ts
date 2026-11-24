/**
 * Optional artificial latency for mock services.
 * Set MOCK_API_DELAY_MS in the environment (e.g. 300). Default: 0.
 */
export async function mockDelay(): Promise<void> {
  const raw = process.env.MOCK_API_DELAY_MS;
  if (!raw) return;

  const ms = Number.parseInt(raw, 10);
  if (!Number.isFinite(ms) || ms <= 0) return;

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
