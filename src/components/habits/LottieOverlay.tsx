import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function LottieOverlay({ data, size = 280 }: { data: ArrayBuffer; size?: number }) {
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
        data={data}
        loop={false}
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
}
