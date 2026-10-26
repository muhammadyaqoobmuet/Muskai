'use client';

import { EnvelopeSimple, Eye, EyeSlash, LockSimple, User } from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/session/SessionProvider';
import { ApiError } from '@/lib/api';

const INPUT =
  'h-[52px] w-full rounded-[12px] border border-ink-700 bg-white pl-11 pr-4 text-[15px] text-ink-100 ' +
  'placeholder:text-ink-500 transition-[border-color,box-shadow] duration-200 ' +
  'hover:border-ink-600 focus:border-spark focus:outline-none focus:ring-4 focus:ring-spark/15';

function LeadingIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-ink-500">
      {children}
    </span>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, register } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next = searchParams.get('next') ?? '/studio';

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === 'signup') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3.5">
      {mode === 'signup' ? (
        <div className="relative">
          <label htmlFor="name" className="sr-only">
            Full name
          </label>
          <LeadingIcon>
            <User size={18} />
          </LeadingIcon>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className={INPUT}
          />
        </div>
      ) : null}

      <div className="relative">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <LeadingIcon>
          <EnvelopeSimple size={18} />
        </LeadingIcon>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className={INPUT}
        />
      </div>

      <div>
        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <LeadingIcon>
            <LockSimple size={18} />
          </LeadingIcon>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={mode === 'signup' ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className={`${INPUT} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-spark/15"
          >
            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {mode === 'signup' ? (
          <p className="mt-2 pl-1 text-[12px] leading-snug text-ink-500">
            At least 8 characters.
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[13px] leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-spark px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-spark-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-spark/25 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
      >
        {pending
          ? mode === 'signup'
            ? 'Creating account…'
            : 'Signing in…'
          : mode === 'signup'
            ? 'Create account'
            : 'Sign in'}
      </button>
    </form>
  );
}
