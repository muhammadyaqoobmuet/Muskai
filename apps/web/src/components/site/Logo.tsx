import Image from 'next/image';
import Link from 'next/link';

const SOURCES = {
  ink: '/muskai-logo-ink.png',
  blue: '/muskai-logo-blue.png',
  white: '/muskai-logo-white.png',
};

/** The full brand lockup: mark plus wordmark, in three tones. */
export function Logo({
  className = '',
  tone = 'ink',
  priority = false,
}: {
  className?: string;
  tone?: keyof typeof SOURCES;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Muskai home"
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src={SOURCES[tone]}
        alt=""
        width={425}
        height={96}
        priority={priority}
        className="h-9 w-auto"
      />
    </Link>
  );
}
