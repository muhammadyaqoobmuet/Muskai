import { Suspense } from 'react';
import { RequireAuth } from '@/components/session/RequireAuth';
import { JobList } from '@/components/studio/JobList';
import { StudioComposer } from '@/components/studio/StudioComposer';
import { WorkspaceShell } from '@/components/studio/WorkspaceShell';
import { StudioStats } from '@/components/studio/StudioStats';

export const metadata = {
  title: 'Studio',
  description: 'Turn a prompt into a vertical reel.',
};

export default function StudioPage() {
  return (
    <div className="min-h-[100dvh]">
      <RequireAuth>
        <WorkspaceShell section="Studio">
          <div>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] text-ink-100">
              Studio
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">
              Write a prompt, set the format, and queue a render.
            </p>
          </div>

          <StudioStats />

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
            <div id="compose" className="scroll-mt-20 xl:sticky xl:top-[72px]">
              <Suspense
                fallback={
                  <div className="h-[560px] rounded-[16px] bg-white ring-1 ring-ink-700/70" />
                }
              >
                <StudioComposer />
              </Suspense>
            </div>

            <JobList />
          </div>
        </WorkspaceShell>
      </RequireAuth>
    </div>
  );
}
