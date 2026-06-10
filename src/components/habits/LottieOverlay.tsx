import Lottie from 'lottie-react';

export function LottieOverlay({ animationData }: { animationData: object }) {
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
      <Lottie
        animationData={animationData}
        loop={false}
        autoplay
        style={{ width: 280, height: 280 }}
      />
    </div>
  );
}
