import { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  CloudIcon,
  HeartIcon,
  WaveSineIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { BottomSheet } from '../ui/BottomSheet';
import { SketchBox } from '../ui/SketchBox';
import { Btn } from '../ui/Btn';
import { Ring } from '../ui/Ring';
import { HandIcon } from '../ui/HandIcon';
import { ConfettiBurst } from '../habits/ConfettiBurst';
import { useCountdown } from '../../hooks/useCountdown';

const SECONDS = 20;
const GREEN = '#5ea463';
const GREEN_SOFT = 'rgba(116,200,116,0.20)';

interface MentalRehearsalSheetProps {
  open: boolean;
  onClose: () => void;
  identity: string;
}

type Phase = 'intro' | 'active' | 'done';

const INTRO_BULLETS: { Glyph: Icon; text: string }[] = [
  { Glyph: EyeIcon, text: 'Imagina que ya empezaste.' },
  { Glyph: CloudIcon, text: 'Véte haciéndolo sin pelear con la resistencia.' },
  { Glyph: HeartIcon, text: 'Siente que esto ya forma parte de ti.' },
];

const DONE_CHECKS = [
  'Imaginaste que ya empezaste',
  'Te viste actuando sin resistencia',
  'Sentiste que forma parte de ti',
];

function Tile({
  children,
  size = 51,
  radius = 14,
  tone = 'coral',
}: {
  children: React.ReactNode;
  size?: number;
  radius?: number;
  tone?: 'coral' | 'green';
}) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tone === 'green' ? GREEN_SOFT : 'var(--coral-soft)',
        border: `1.5px solid ${tone === 'green' ? GREEN : 'var(--coral)'}`,
      }}
    >
      {children}
    </div>
  );
}

function Header() {
  return (
    <div style={{ alignSelf: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Tile>
          <HandIcon kind="brain" size={30} />
        </Tile>
        <div>
          <div className="font-display" style={{ fontSize: 30, lineHeight: 1 }}>Ensayo mental</div>
          <div
            className="font-hand text-ink-soft"
            style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}
          >
            <ClockIcon size={16} color="var(--ink-soft)" />
            Duración: {SECONDS} segundos
          </div>
        </div>
      </div>
    </div>
  );
}

export function MentalRehearsalSheet({ open, onClose, identity }: MentalRehearsalSheetProps) {
  const [phase, setPhase] = useState<Phase>('intro');

  const remaining = useCountdown(SECONDS, phase === 'active', () => setPhase('done'));

  // Reset to intro whenever the sheet closes (parent only closes via these handlers).
  function close() {
    setPhase('intro');
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={close} dismissable={phase !== 'active'} maxHeight="92%">
      {phase === 'done' && <ConfettiBurst />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: phase === 'intro' ? 'flex-start' : 'center',
          gap: 23,
          padding: '12px 4px 10px',
          minHeight: '74vh',
        }}
      >

        {phase === 'intro' && (
          <>
            <Header />

            <div className="font-hand text-ink-soft" style={{ fontSize: 17, alignSelf: 'flex-start' }}>
              Tu identidad en este hábito:
            </div>
            <div className="font-display text-coral text-center" style={{ fontSize: 30, lineHeight: 1.15 }}>
              "{identity}"
            </div>

            <SketchBox padding={21} radius={14} style={{ alignSelf: 'stretch' }}>
              <div className="font-hand" style={{ fontSize: 20 }}>¿Qué haremos?</div>
              <div className="font-hand text-ink-soft" style={{ fontSize: 17, marginTop: 9, lineHeight: 1.4 }}>
                En {SECONDS} segundos, vas a imaginarte actuando como esa persona para reforzar tu identidad.
              </div>
              <div style={{ height: 1.5, background: 'var(--ink-soft)', opacity: 0.25, margin: '18px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {INTRO_BULLETS.map(({ Glyph, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tile size={44} radius={11}>
                      <Glyph size={21} color="var(--ink)" />
                    </Tile>
                    <span className="font-hand" style={{ fontSize: 18, lineHeight: 1.2 }}>{text}</span>
                  </div>
                ))}
              </div>
            </SketchBox>

            <Btn variant="primary" size="lg" fullWidth onClick={() => setPhase('active')} style={{ marginTop: 6 }}>
              Comenzar ensayo
            </Btn>
            <button
              onClick={close}
              className="font-hand text-ink-soft bg-transparent border-none cursor-pointer"
              style={{ fontSize: 17 }}
            >
              Ahora no
            </button>
          </>
        )}

        {phase === 'active' && (
          <>
            <Header />

            <div className="relative" style={{ marginTop: 8 }}>
              <Ring size={241} stroke={14} value={remaining / SECONDS} color="var(--coral)" />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ padding: 39 }}
              >
                <WaveSineIcon size={30} color="var(--ink-soft)" />
                <div className="font-hand" style={{ fontSize: 18, marginTop: 9, lineHeight: 1.2 }}>
                  Respira, visualiza y actúa como esa persona.
                </div>
                <div className="font-display" style={{ fontSize: 46, fontWeight: 700, marginTop: 9, lineHeight: 1 }}>
                  {remaining}s
                </div>
              </div>
            </div>

            <div className="font-hand text-ink-soft text-center" style={{ fontSize: 17, maxWidth: 300 }}>
              Imagina la escena con todos los detalles posibles.
            </div>

            <Btn variant="primary" size="lg" fullWidth disabled style={{ marginTop: 4 }}>
              Estoy imaginando…
            </Btn>
          </>
        )}

        {phase === 'done' && (
          <>
            <Tile size={83} radius={21} tone="green">
              <HandIcon kind="brain" size={39} color={GREEN} />
            </Tile>
            <div className="font-display" style={{ fontSize: 32, lineHeight: 1 }}>¡Buen trabajo!</div>
            <div className="font-hand text-center text-ink-soft" style={{ fontSize: 17 }}>
              Acabas de ensayar tu identidad.
            </div>

            <SketchBox padding={23} radius={14} style={{ alignSelf: 'stretch' }}>
              <div className="font-display text-center" style={{ fontSize: 25, lineHeight: 1.2 }}>
                "Cada vez que lo haces, refuerzas quién eres."
              </div>
            </SketchBox>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch', marginTop: 4 }}>
              {DONE_CHECKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleIcon size={25} weight="fill" color={GREEN} />
                  <span className="font-hand" style={{ fontSize: 18 }}>{t}</span>
                </div>
              ))}
            </div>

            <Btn variant="primary" size="lg" fullWidth onClick={close} style={{ marginTop: 6 }}>
              Listo, continuar
            </Btn>
          </>
        )}

      </div>
    </BottomSheet>
  );
}
