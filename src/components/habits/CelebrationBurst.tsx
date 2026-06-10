import { useState, type ReactNode } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { LottieOverlay } from './LottieOverlay';

export const LOTTIE_CELEBRATIONS = [
  '/animations/done.lottie',
  '/animations/check.lottie',
  '/animations/burst.lottie',
  '/animations/success.lottie',
  '/animations/tick.lottie',
  '/animations/yoga.lottie',
  '/animations/search.lottie',
] as const;

type Celebration =
  | { kind: 'confetti' }
  | { kind: 'lottie'; src: string };

const CELEBRATIONS: Celebration[] = [
  { kind: 'confetti' },
  ...LOTTIE_CELEBRATIONS.map((src) => ({ kind: 'lottie' as const, src })),
];

function pick(): Celebration {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}

function render(c: Celebration): ReactNode {
  return c.kind === 'confetti' ? <ConfettiBurst /> : <LottieOverlay src={c.src} />;
}

export function CelebrationBurst() {
  const [choice] = useState(pick);
  return render(choice);
}

const prefetched = new Set<string>();

export function prefetchCelebrationLotties() {
  for (const src of LOTTIE_CELEBRATIONS) {
    if (prefetched.has(src)) continue;
    prefetched.add(src);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'fetch';
    link.href = src;
    document.head.appendChild(link);
  }
}
