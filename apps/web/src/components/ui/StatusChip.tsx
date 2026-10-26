import type { GenerationStatus } from '@muskai/shared';
import { Chip, LiveDot } from '@/components/ui/Chip';

const LABELS: Record<GenerationStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Generating',
  STITCHING: 'Stitching',
  SUCCEEDED: 'Ready',
  FAILED: 'Failed',
};

export function StatusChip({ status }: { status: GenerationStatus }) {
  const live = status === 'RUNNING' || status === 'STITCHING';
  const tone =
    status === 'SUCCEEDED'
      ? 'ready'
      : status === 'FAILED'
        ? 'danger'
        : live
          ? 'live'
          : 'neutral';

  return (
    <Chip tone={tone}>
      {live ? <LiveDot /> : null}
      {LABELS[status]}
    </Chip>
  );
}
