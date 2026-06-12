import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';

export const LOTTIE_CELEBRATIONS = [
  '/animations/done.lottie',
  '/animations/burst.lottie',
  '/animations/successCheck.lottie',
  '/animations/people.lottie',
] as const;

// Serve the WASM renderer from our own bundle instead of jsDelivr — the CDN
// fetch was the slowest link and is dead offline.
setWasmUrl(wasmUrl);

const loaded = new Map<string, ArrayBuffer>();
let started = false;

export function prefetchCelebrationLotties() {
  if (started) return;
  started = true;
  // Warm the WASM into HTTP cache so first play only pays instantiation.
  fetch(wasmUrl).catch(() => {});
  for (const src of LOTTIE_CELEBRATIONS) {
    fetch(src)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`${res.status}`))))
      .then((buf) => loaded.set(src, buf))
      .catch(() => {});
  }
}

export function getLottieData(src: string): ArrayBuffer | null {
  return loaded.get(src) ?? null;
}
