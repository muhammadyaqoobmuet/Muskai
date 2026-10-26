'use client';

import { useQuery } from '@tanstack/react-query';
import { CAPABILITY_LABELS, MODEL_REGISTRY } from '@muskai/shared';
import type { Capability, ModelDefinition } from '@muskai/shared';
import { api } from '@/lib/api';

/**
 * The engine list, grouped by what each model can do, with the live quota
 * ledger rather than the numbers the registry was written with.
 */
export function ModelFleet() {
  const query = useQuery({ queryKey: ['models'], queryFn: api.listModels });

  const usage = new Map(
    (query.data ?? []).map((model) => [`${model.id}|${model.capability}`, model]),
  );

  const groups = new Map<Capability, ModelDefinition[]>();
  for (const model of MODEL_REGISTRY) {
    const list = groups.get(model.capability) ?? [];
    list.push(model);
    groups.set(model.capability, list);
  }

  return (
    <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
      {[...groups.entries()].map(([capability, models]) => (
        <section key={capability}>
          <div className="flex items-baseline justify-between gap-4 pb-3">
            <h3 className="text-[17px] font-semibold text-ink-100">
              {CAPABILITY_LABELS[capability]}
            </h3>
            <span className="font-mono text-[11px] text-ink-500">
              {models.length} {models.length === 1 ? 'model' : 'models'}
            </span>
          </div>

          <ul className="border-t border-ink-700">
            {models.map((model) => {
              const live = usage.get(`${model.id}|${model.capability}`);
              const total = live?.quotaTotal ?? model.quotaTotal;
              const remaining = live?.unitsRemaining ?? total;
              const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
              const exhausted = live?.exhausted ?? false;

              return (
                <li
                  key={`${model.id}-${model.capability}`}
                  className="flex items-start gap-4 border-b border-ink-700 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink-100">{model.displayName}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-400">{model.note}</p>
                  </div>

                  <div className="w-24 shrink-0 text-right">
                    <p
                      className={`text-[13px] tabular-nums ${
                        exhausted ? 'text-ink-500' : 'text-ink-300'
                      }`}
                    >
                      {exhausted ? 'Pool spent' : `${remaining} left`}
                    </p>
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out-expo ${
                          exhausted ? 'bg-ink-600' : 'bg-ink-100'
                        }`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
