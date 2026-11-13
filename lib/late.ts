/**
 * Lazy lateness check (docs/FLOWS.md section 5). There is no background job on the
 * free tier, so every cafe queue poll calls this first.
 *
 * Phase 6 only wires the call. Phase 8 fills it in: due state, grace, penalty
 * lock, refunds, runner debit, alerts. Until then it does nothing, on purpose.
 */
export async function sweepLate(now: number): Promise<void> {
  void now;
}
