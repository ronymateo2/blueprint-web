export const LOTTIE_CELEBRATIONS = [
  '/animations/done.lottie',
  '/animations/burst.lottie',
  '/animations/successCheck.lottie',
  '/animations/people.lottie',
] as const;

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
