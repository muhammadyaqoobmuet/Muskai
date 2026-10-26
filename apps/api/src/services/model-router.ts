import type { Capability, ModelInfoDTO } from '@muskai/shared';
import { MODEL_REGISTRY, modelsForCapability } from '@muskai/shared';
import { prisma } from '../db/client';
import { ProviderError, QuotaExhaustedError } from '../providers/provider.interface';

/**
 * The model router: owns the fallback chains and the quota ledger.
 *
 * - Chains come from the shared registry (chainOrder ascending).
 * - A model the user explicitly picked is tried first, then the chain.
 * - Models marked exhausted in the ledger are skipped.
 * - Every provider call is recorded (+1 observed unit). A quota 403 marks
 *   the model exhausted and the router moves on — inside the same job.
 */

/** Make sure every registry pool has a ledger row. */
export async function ensureUsageRows(): Promise<void> {
  const seen = new Set<string>();
  for (const model of MODEL_REGISTRY) {
    if (seen.has(model.id)) continue; // vace-plus is in two chains, one pool
    seen.add(model.id);
    await prisma.modelUsage.upsert({
      where: { model: model.id },
      create: {
        model: model.id,
        capability: model.capability,
        quotaTotal: model.quotaTotal,
      },
      update: {},
    });
  }
}

async function recordCall(model: string): Promise<void> {
  await prisma.modelUsage.update({
    where: { model },
    data: { unitsObservedUsed: { increment: 1 } },
  });
}

async function markExhausted(model: string, message: string): Promise<void> {
  await prisma.modelUsage.update({
    where: { model },
    data: { exhausted: true, lastError: message.slice(0, 500) },
  });
}

async function recordError(model: string, message: string): Promise<void> {
  await prisma.modelUsage.update({
    where: { model },
    data: { lastError: message.slice(0, 500) },
  });
}

/** Registry rows + live ledger state, for GET /api/models. */
export async function listModelsWithUsage(): Promise<ModelInfoDTO[]> {
  await ensureUsageRows();
  const rows = await prisma.modelUsage.findMany();
  const byModel = new Map(rows.map((r) => [r.model, r]));
  return MODEL_REGISTRY.map((def) => {
    const row = byModel.get(def.id);
    const used = row?.unitsObservedUsed ?? 0;
    return {
      id: def.id,
      displayName: def.displayName,
      capability: def.capability,
      quotaTotal: def.quotaTotal,
      unitsUsed: used,
      unitsRemaining: Math.max(0, def.quotaTotal - used),
      exhausted: row?.exhausted ?? false,
      lastError: row?.lastError ?? null,
    };
  });
}

export interface RouterOutcome<T> {
  model: string;
  value: T;
}

/**
 * Run `attempt` against models in chain order until one succeeds.
 * - QuotaExhaustedError → ledger marked, next model.
 * - Any other error → recorded, next model (these pools are precious;
 *   a different engine often succeeds where one failed).
 * Throws the last error when the whole chain is spent.
 */
export async function runWithFallback<T>(
  capability: Capability,
  requestedModelId: string | null,
  attempt: (modelId: string) => Promise<T>,
): Promise<RouterOutcome<T>> {
  await ensureUsageRows();
  const chain = modelsForCapability(capability);
  if (chain.length === 0) {
    throw new ProviderError(`No models registered for capability ${capability}`, 'NO_MODELS');
  }

  // Explicit pick first (if it belongs to this capability), then the chain.
  const ordered = [...chain];
  if (requestedModelId) {
    const idx = ordered.findIndex((m) => m.id === requestedModelId);
    if (idx > 0) {
      const [picked] = ordered.splice(idx, 1);
      if (picked) ordered.unshift(picked);
    }
  }

  const usageRows = await prisma.modelUsage.findMany();
  const exhausted = new Set(usageRows.filter((r) => r.exhausted).map((r) => r.model));
  const candidates = ordered.filter((m) => !exhausted.has(m.id));
  const toTry = candidates.length > 0 ? candidates : ordered; // if all marked, try anyway

  let lastError: unknown = null;
  for (const model of toTry) {
    try {
      await recordCall(model.id);
      const value = await attempt(model.id);
      return { model: model.id, value };
    } catch (err) {
      lastError = err;
      if (err instanceof QuotaExhaustedError) {
        await markExhausted(model.id, err.message);
        console.warn(`[router] ${model.id} quota exhausted — falling through the chain`);
        continue;
      }
      await recordError(model.id, err instanceof Error ? err.message : String(err));
      console.warn(
        `[router] ${model.id} failed (${err instanceof Error ? err.message : String(err)}) — trying next model`,
      );
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ProviderError(`All models failed for capability ${capability}`, 'CHAIN_EXHAUSTED');
}
