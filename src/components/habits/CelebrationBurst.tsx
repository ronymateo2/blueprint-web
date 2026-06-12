import { useState, type ReactNode } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { LottieOverlay } from './LottieOverlay';
import { LOTTIE_CELEBRATIONS, getLottieData } from './celebrations';

type Celebration =
  | { kind: 'confetti' }
  | { kind: 'lottie'; data: ArrayBuffer };

// Only offer lotties whose data is already in memory — anything else would
// render blank during its 2.8s window. Confetti is always ready.
function pick(): Celebration {
  const ready: Celebration[] = [{ kind: 'confetti' }];
  for (const src of LOTTIE_CELEBRATIONS) {
    const data = getLottieData(src);
    if (data) ready.push({ kind: 'lottie', data });
  }
  return ready[Math.floor(Math.random() * ready.length)];
}

function render(c: Celebration): ReactNode {
  return c.kind === 'confetti' ? <ConfettiBurst /> : <LottieOverlay data={c.data} />;
}

export function CelebrationBurst() {
  const [choice] = useState(pick);
  return render(choice);
}
