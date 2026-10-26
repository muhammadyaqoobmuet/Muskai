'use client';

import {
  CaretRight,
  Compass,
  FilmStrip,
  List,
  PenNib,
  Plus,
  SignOut,
  X,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from '@/components/session/SessionProvider';
import { Logo } from '@/components/site/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';

const LINKS = [
  { href: '/studio', label: 'Studio', icon: PenNib },
  { href: '/library', label: 'My reels', icon: FilmStrip },
  { href: '/explore', label: 'Explore', icon: Compass },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function focusComposer() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('compose')?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  });
  window.setTimeout(
    () => document.getElementById('prompt')?.focus({ preventScroll: true }),
    reduce ? 0 : 320,
  );
}

export function WorkspaceShell({
  section,
  children,
}: {
  section: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const startReel = () => {
    if (!document.getElementById('prompt')) {
      router.push('/studio');
      return;
    }
    focusComposer();
  };

  const signOut = async () => {
    setMobileOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-[100dvh] bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-ink-700/70 bg-white px-4 pb-4 lg:flex">
        <div className="px-2 pt-5 pb-7">
          <Logo priority />
        </div>

        <nav aria-label="Workspace" className="flex flex-col gap-1">
          <p className="px-3 pb-1.5 text-[11px] font-medium text-ink-500">Workspace</p>
          {LINKS.slice(0, 2).map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
              icon={<link.icon size={17} weight="regular" />}
            />
          ))}

          <p className="mt-5 px-3 pb-1.5 text-[11px] font-medium text-ink-500">Discover</p>
          <SidebarLink
            href="/explore"
            label="Explore community"
            active={isActive(pathname, '/explore')}
            icon={<Compass size={17} weight="regular" />}
          />
        </nav>

        {user ? (
          <div className="mt-auto flex items-center gap-1 border-t border-ink-700/70 pt-3">
            <Link
              href={`/u/${user.handle}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] p-2 transition-colors duration-200 hover:bg-ink-950"
            >
              <Avatar name={user.name} src={user.avatarUrl} size={30} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink-100">
                  {user.name}
                </span>
                <span className="block truncate text-[11px] text-ink-500">@{user.handle}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-ink-500 transition-colors duration-200 hover:bg-danger-soft hover:text-danger"
            >
              <SignOut size={15} />
            </button>
          </div>
        ) : null}
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-ink-700/70 bg-white/85 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                ref={menuTriggerRef}
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="workspace-mobile-nav"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-100 transition-colors duration-200 hover:bg-ink-950 lg:hidden"
              >
                {mobileOpen ? <X size={19} /> : <List size={19} />}
              </button>

              <div className="hidden items-center gap-1.5 text-[12px] lg:flex">
                <span className="text-ink-500">Workspace</span>
                <CaretRight size={10} className="text-ink-600" />
                <span className="font-medium text-ink-100">{section}</span>
              </div>

              <Logo className="lg:hidden [&_img]:h-8" priority />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startReel}
                className={buttonStyles('primary', 'sm', 'max-sm:hidden')}
              >
                <Plus size={13} weight="bold" />
                New reel
              </button>
              {user ? (
                <Link
                  href={`/u/${user.handle}`}
                  aria-label="Your profile"
                  className="rounded-full lg:hidden"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size={28} />
                </Link>
              ) : null}
            </div>
          </div>

          {mobileOpen ? (
            <div
              id="workspace-mobile-nav"
              className="border-t border-ink-700/70 bg-white px-4 pt-2 pb-4 lg:hidden"
            >
              <nav aria-label="Workspace" className="flex flex-col gap-1">
                {LINKS.map((link) => (
                  <SidebarLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={isActive(pathname, link.href)}
                    icon={<link.icon size={17} />}
                  />
                ))}
              </nav>
              {user ? (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-700/70 pt-3">
                  <Link
                    href={`/u/${user.handle}`}
                    className="flex min-w-0 items-center gap-2.5 rounded-[10px] p-1.5"
                  >
                    <Avatar name={user.name} src={user.avatarUrl} size={30} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink-100">
                        {user.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-500">
                        @{user.handle}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] text-ink-500 transition-colors duration-200 hover:bg-danger-soft hover:text-danger"
                  >
                    <SignOut size={15} />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-5 py-7 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-medium transition-colors duration-200 ${
        active
          ? 'bg-ink-950 text-ink-100'
          : 'text-ink-400 hover:bg-ink-950 hover:text-ink-100'
      }`}
    >
      <span className={active ? 'text-spark' : 'text-ink-500'}>{icon}</span>
      {label}
    </Link>
  );
}
