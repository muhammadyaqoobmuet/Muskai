import Link from 'next/link';
import { Suspense } from 'react';
import { AuthAside } from '@/components/auth/AuthAside';
import { AuthForm } from '@/components/auth/AuthForm';
import { Logo } from '@/components/site/Logo';

export const metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] bg-white lg:grid-cols-2">
      <section className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex justify-end">
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-full px-2 text-[12px] text-ink-400 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
          >
            Back to Muskai
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <Logo tone="blue" priority />

            <h1 className="mt-9 text-[38px] leading-[1.05] font-semibold tracking-[-0.032em] text-ink-100">
              Welcome back.
            </h1>
            <p className="mt-3 text-[16px] leading-[1.5] text-ink-400">
              Sign in to open the Studio and get back to your reels.
            </p>

            <div className="mt-9">
              <Suspense fallback={<div className="h-[200px]" />}>
                <AuthForm mode="login" />
              </Suspense>
            </div>

            <p className="mt-7 text-[14px] text-ink-400">
              No account yet?{' '}
              <Link
                href="/signup"
                className="inline-block py-1 font-medium text-spark-text hover:underline hover:underline-offset-4"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
