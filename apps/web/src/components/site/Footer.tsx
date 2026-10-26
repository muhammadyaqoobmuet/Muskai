import Link from 'next/link';
import { Logo } from '@/components/site/Logo';

const COLUMNS = [
  {
    title: 'Create',
    links: [
      { href: '/studio', label: 'The Studio' },
      { href: '/explore', label: 'Explore reels' },
      { href: '/library', label: 'My reels' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/signup', label: 'Create account' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-950">
      <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-8 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(2,minmax(0,0.6fr))]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[12px] leading-[1.45] text-ink-400">
              Write a prompt, get a finished reel. Built on the Wan model family, stitched and
              delivered for the vertical feed.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[12px] font-semibold text-ink-300">{column.title}</p>
              <ul className="mt-3 space-y-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 text-[12px] text-ink-400 transition-colors duration-200 hover:text-ink-100 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-ink-700 pt-6 text-[12px] leading-[1.5] text-ink-500">
          Reels generated on Muskai are yours to publish and share. Model output can vary between
          runs. Free-quota capacity is shared across creators and refills daily.
        </p>

        <div className="mt-4 flex flex-col gap-2 text-[12px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © {new Date().getFullYear()} Muskai. All rights reserved.</p>
          <p>Runs on Alibaba Model Studio, Singapore</p>
        </div>
      </div>
    </footer>
  );
}
