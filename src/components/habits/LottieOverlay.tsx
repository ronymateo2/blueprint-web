import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function LottieOverlay({ src, size = 280 }: { src: string; size?: number }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <DotLottieReact
        src={src}
        loop={false}
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
}
