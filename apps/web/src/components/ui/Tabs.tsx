'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';

/**
 * Tabs with a sliding pill, in the shape the Kobra registry uses
 * (Tabs / TabsList / TabsTrigger), which sits behind a paid token.
 *
 * The indicator is measured from the active trigger, so it still lands
 * correctly when the list wraps onto a second row on narrow screens.
 */
type TabsContextValue = { value: string; setValue: (value: string) => void };

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string) {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`<${part}> must be rendered inside <Tabs>.`);
  return context;
}

interface TabsProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export function Tabs({ value, onValueChange, children, ...rest }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div {...rest}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, onKeyDown, ...rest }: ComponentProps<'div'>) {
  const { value } = useTabs('TabsList');
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) {
        setPill(null);
        return;
      }
      const lr = list.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      setPill({
        x: ar.left - lr.left - list.clientLeft,
        y: ar.top - lr.top - list.clientTop,
        w: ar.width,
        h: ar.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value]);

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const list = listRef.current;
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    if (!tabs.length) return;

    const current = tabs.findIndex((tab) => tab.getAttribute('data-state') === 'active');
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : event.key === 'ArrowRight'
            ? (Math.max(current, 0) + 1) % tabs.length
            : (Math.max(current, 0) - 1 + tabs.length) % tabs.length;

    event.preventDefault();
    tabs[index]?.focus();
    tabs[index]?.click();
  };

  return (
    <div
      {...rest}
      ref={listRef}
      role="tablist"
      onKeyDown={move}
      className={`relative flex flex-wrap gap-1 rounded-pill bg-ink-950 p-1 ${className ?? ''}`}
    >
      <span
        aria-hidden
        data-slot="tabs-indicator"
        className="pointer-events-none absolute left-0 top-0 rounded-pill bg-white shadow-sm transition-[transform,width,height,opacity] duration-300 ease-out-expo"
        style={
          pill
            ? { transform: `translate(${pill.x}px, ${pill.y}px)`, width: pill.w, height: pill.h }
            : { opacity: 0 }
        }
      />
      {children}
    </div>
  );
}

interface TabsTriggerProps extends ComponentProps<'button'> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...rest }: TabsTriggerProps) {
  const { value: active, setValue } = useTabs('TabsTrigger');
  const selected = active === value;

  return (
    <button
      {...rest}
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? 'active' : 'inactive'}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={`relative z-10 rounded-pill px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
        selected ? 'text-ink-100' : 'text-ink-400 hover:text-ink-100'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  );
}
