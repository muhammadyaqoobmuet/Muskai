import { MyReels } from '@/components/library/MyReels';
import { RequireAuth } from '@/components/session/RequireAuth';
import { WorkspaceShell } from '@/components/studio/WorkspaceShell';

export const metadata = {
  title: 'My reels',
  description: 'Every reel you have generated, and what you have shared.',
};

export default function LibraryPage() {
  return (
    <div className="min-h-[100dvh]">
      <RequireAuth>
        <WorkspaceShell section="My reels">
          <div>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] text-ink-100">
              Your library
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">
              Every reel you have made. Publish one to put it in front of the community.
            </p>
          </div>

          <div className="mt-6">
            <MyReels />
          </div>
        </WorkspaceShell>
      </RequireAuth>
    </div>
  );
}
