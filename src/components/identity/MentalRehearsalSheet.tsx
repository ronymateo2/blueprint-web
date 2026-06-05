import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { BottomSheet } from '../ui/BottomSheet';
import { Btn } from '../ui/Btn';
import { Ring } from '../ui/Ring';
import { HandIcon } from '../ui/HandIcon';
import { useCountdown } from '../../hooks/useCountdown';

const SECONDS = 20;

interface MentalRehearsalSheetProps {
  open: boolean;
  onClose: () => void;
  identity: string;
}

type Phase = 'intro' | 'active' | 'done';

const INTRO_BULLETS = [
  { icon: 'target', text: 'Imagina que ya empezaste.' },
  { icon: 'leaf', text: 'Véte haciéndolo sin pelear con la resistencia.' },
  { icon: 'heart', text: 'Siente que esto ya forma parte de ti.' },
];

const DONE_CHECKS = [
  'Imaginaste que ya empezaste',
  'Te viste actuando sin resistencia',
  'Sentiste que forma parte de ti',
];

export function MentalRehearsalSheet({ open, onClose, identity }: MentalRehearsalSheetProps) {
  const [phase, setPhase] = useState<Phase>('intro');

  const remaining = useCountdown(SECONDS, phase === 'active', () => setPhase('done'));

  // Reset to intro whenever the sheet closes (parent only closes via these handlers).
  function close() {
    setPhase('intro');
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={close} dismissable={phase !== 'active'}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '6px 2px 4px' }}>

        {phase === 'intro' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
              <HandIcon kind="brain" size={30} />
              <div>
                <div className="font-display" style={{ fontSize: 26, lineHeight: 1 }}>Ensayo mental</div>
                <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>Duración: {SECONDS} segundos</div>
              </div>
            </div>

            <div className="font-hand text-ink-soft" style={{ fontSize: 13, alignSelf: 'flex-start' }}>
              Tu identidad:
            </div>
            <div
              className="font-display text-coral text-center"
              style={{ fontSize: 26, lineHeight: 1.15 }}
            >
              “{identity}”
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'stretch', marginTop: 4 }}>
              {INTRO_BULLETS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HandIcon kind={b.icon} size={18} color="var(--ink-soft)" />
                  <span className="font-hand" style={{ fontSize: 15 }}>{b.text}</span>
                </div>
              ))}
            </div>

            <Btn variant="primary" size="lg" fullWidth onClick={() => setPhase('active')} style={{ marginTop: 6 }}>
              Comenzar ensayo
            </Btn>
            <button
              onClick={close}
              className="font-hand text-ink-soft bg-transparent border-none cursor-pointer"
              style={{ fontSize: 15 }}
            >
              Ahora no
            </button>
          </>
        )}

        {phase === 'active' && (
          <>
            <div className="font-display" style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}>Ensayo mental</div>
            <Ring
              size={210}
              stroke={12}
              value={remaining / SECONDS}
              color="var(--coral)"
              label={`${remaining}s`}
              labelSize={54}
            />
            <div className="font-hand text-center" style={{ fontSize: 16, maxWidth: 260 }}>
              Respira, visualiza y actúa como esa persona.
            </div>
            <div className="font-hand text-ink-soft text-center" style={{ fontSize: 13, maxWidth: 260 }}>
              Imagina la escena con todos los detalles posibles.
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <div
              className="flex items-center justify-center"
              style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--coral-soft)', border: '1.6px solid var(--coral)', marginTop: 4 }}
            >
              <HandIcon kind="brain" size={34} color="var(--coral)" />
            </div>
            <div className="font-display" style={{ fontSize: 28, lineHeight: 1 }}>¡Buen trabajo!</div>
            <div className="font-hand text-center text-ink-soft" style={{ fontSize: 15, maxWidth: 280 }}>
              “Cada vez que lo haces, refuerzas quién eres.”
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'stretch', marginTop: 2 }}>
              {DONE_CHECKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckIcon size={18} weight="bold" color="var(--coral)" />
                  <span className="font-hand" style={{ fontSize: 15 }}>{t}</span>
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
