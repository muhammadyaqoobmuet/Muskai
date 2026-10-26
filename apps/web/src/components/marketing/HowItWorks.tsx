import { Reveal } from '@/components/motion/Reveal';

const STEPS = [
  {
    title: 'Describe the shot',
    body: 'One sentence, or borrow a starter. Pick a mode, a shape and a length.',
  },
  {
    title: 'Let the queue render',
    body: 'The router takes the first engine with quota left and stitches the segments into one clip.',
  },
  {
    title: 'Publish or download',
    body: 'Share the finished reel to the community feed, or take the MP4 with you.',
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-12 md:grid-cols-3 md:gap-10">
      {STEPS.map((step, index) => (
        <Reveal key={step.title} delay={index * 0.1}>
          <li>
            <span className="font-mono text-[12px] tracking-[0.08em] text-ink-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink-100">
              {step.title}
            </h3>
            <p className="mt-3 max-w-xs text-[17px] leading-[1.47] text-ink-400">{step.body}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
