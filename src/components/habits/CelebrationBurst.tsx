import { useState, type ReactNode } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { LottieOverlay } from './LottieOverlay';
import doneAnimation from './doneAnimation.json';
import checkAnimation from './checkAnimation.json';
import burstAnimation from './burstAnimation.json';

type Celebration = { render: () => ReactNode };

const CELEBRATIONS: Celebration[] = [
  { render: () => <ConfettiBurst /> },
  { render: () => <LottieOverlay animationData={doneAnimation} /> },
  { render: () => <LottieOverlay animationData={checkAnimation} /> },
  { render: () => <LottieOverlay animationData={burstAnimation} /> },
];

export function CelebrationBurst() {
  const [pick] = useState(() => CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
  return pick.render();
}
