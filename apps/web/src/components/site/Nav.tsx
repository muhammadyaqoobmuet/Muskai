'use client';

import {
  CaretDown,
  CaretRight,
  List,
  Plus,
  SignOut,
  User as UserIcon,
  Compass,
  FilmStrip,
  X,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/session/SessionProvider';
import { Avatar } from '@/components/ui/Avatar';
import { buttonStyles } from '@/components/ui/Button';
import { Logo } from '@/components/site/Logo';

const LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/studio', label: 'Studio' },
  { href: '/library', label: 'My reels' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    menuPanelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open && !mobileOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !mobileRef.current?.contains(target)) {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const wasOpen = open;
        setOpen(false);
        setMobileOpen(false);
        if (wasOpen) menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, mobileOpen]);

  const moveMenuFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuPanelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next =
        event.key === 'ArrowDown'
          ? (current + 1) % items.length
          : (current - 1 + items.length) % items.length;
      items[next]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/80 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Logo priority />

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-ink-700/70 bg-ink-950/70 p-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-8 items-center rounded-full px-4 text-[13px] leading-none font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-ink-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-ink-700/60'
                      : 'text-ink-400 hover:bg-white/70 hover:text-ink-100'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href="/studio"
              className={buttonStyles('primary', 'sm', 'max-sm:hidden sm:inline-flex')}
            >
              <Plus size={13} weight="bold" />
              New reel
            </Link>
          ) : null}

          {loading ? (
            <div className="h-7 w-7 animate-pulse rounded-full bg-ink-800" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                ref={menuTriggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls="user-menu"
                className="flex items-center gap-1 rounded-full p-0.5 pr-1 transition-colors duration-200 hover:bg-ink-950"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={28} />
                <CaretDown
                  size={11}
                  weight="bold"
                  className={`text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open ? (
                <div
                  id="user-menu"
                  ref={menuPanelRef}
                  role="menu"
                  onKeyDown={moveMenuFocus}
                  className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-card border border-ink-700 bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                >
                  <div className="border-b border-ink-700/70 px-3 py-2.5">
                    <p className="truncate text-[14px] font-semibold text-ink-100">{user.name}</p>
                    <p className="truncate text-[12px] text-ink-400">@{user.handle}</p>
                  </div>
                  <MenuLink href={`/u/${user.handle}`} icon={<UserIcon size={16} />}>
                    Profile
                  </MenuLink>
                  <MenuLink href="/explore" icon={<Compass size={16} />}>
                    Explore
                  </MenuLink>
                  <MenuLink href="/library" icon={<FilmStrip size={16} />}>
                    My reels
                  </MenuLink>
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={async () => {
                      setOpen(false);
                      await logout();
                      router.push('/');
                    }}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[14px] text-ink-300 transition-colors duration-200 hover:bg-danger-soft hover:text-danger"
                  >
                    <SignOut size={16} />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-8 items-center rounded-full px-2 text-[12px] text-ink-100/80 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonStyles('primary', 'sm', 'max-sm:hidden sm:inline-flex')}
              >
                Create account
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-100 transition-colors duration-200 hover:bg-ink-950 md:hidden"
          >
            {mobileOpen ? <X size={19} /> : <List size={19} />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="mobile-menu"
          ref={mobileRef}
          className="border-t border-ink-700 bg-white px-5 pt-3 pb-6 md:hidden"
        >
          <ul>
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between border-b border-ink-700/60 py-3.5 text-[17px] ${
                      active ? 'font-medium text-ink-100' : 'text-ink-300'
                    }`}
                  >
                    {link.label}
                    <CaretRight size={14} className="text-ink-500" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {user ? (
            <div className="mt-5 space-y-3">
              <Link
                href={`/u/${user.handle}`}
                className="flex items-center gap-2.5 text-[15px] text-ink-300"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={30} />
                <span className="truncate">@{user.handle}</span>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMobileOpen(false);
                  await logout();
                  router.push('/');
                }}
                className="flex w-full items-center gap-2.5 rounded-control py-2.5 text-left text-[15px] text-ink-400 transition-colors duration-200 hover:text-danger"
              >
                <SignOut size={16} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className={buttonStyles('secondary', 'md', 'w-full justify-center')}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonStyles('primary', 'md', 'w-full justify-center')}
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      tabIndex={-1}
      className="flex items-center gap-2.5 rounded-control px-3 py-2 text-[14px] text-ink-300 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
    >
      {icon}
      {children}
    </Link>
  );
}
