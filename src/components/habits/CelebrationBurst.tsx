import { useState, type ReactNode } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { LottieOverlay } from './LottieOverlay';

type Celebration =
  | { kind: 'confetti' }
  | { kind: 'lottie'; src: string };

const CELEBRATIONS: Celebration[] = [
  { kind: 'confetti' },
  { kind: 'lottie', src: '/animations/done.lottie' },
  { kind: 'lottie', src: '/animations/check.lottie' },
  { kind: 'lottie', src: '/animations/burst.lottie' },
  { kind: 'lottie', src: '/animations/success.lottie' },
  { kind: 'lottie', src: '/animations/tick.lottie' },
  { kind: 'lottie', src: '/animations/yoga.lottie' },
  { kind: 'lottie', src: '/animations/search.lottie' },
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
