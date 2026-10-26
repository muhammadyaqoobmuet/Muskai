/**
 * One-click prompt handoff between the demo cards and the hero composer.
 * A window event keeps the two client components decoupled without adding
 * a store or lifting the whole landing page into a client component.
 */
const EVENT = 'muskai:prompt';

export function handOffPrompt(prompt: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: prompt }));
}

export function onPromptHandoff(callback: (prompt: string) => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => callback((event as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
