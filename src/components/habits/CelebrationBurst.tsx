import { useState, type ReactNode } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { LottieOverlay } from './LottieOverlay';
import { LOTTIE_CELEBRATIONS } from './celebrations';

type Celebration =
  | { kind: 'confetti' }
  | { kind: 'lottie'; src: string };

const CELEBRATIONS: Celebration[] = [
  // { kind: 'confetti' },
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
