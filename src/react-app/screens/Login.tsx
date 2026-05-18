import { Scribble } from '../components/Scribble';
import { HandIcon } from '../components/HandIcon';

export function Login() {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';

  return (
    <div className="screen items-center justify-center gap-0" style={{ padding: '40px 32px' }}>
      {/* Logo / Title */}
      <div className="flex flex-col items-center" style={{ marginBottom: 48 }}>
        <div className="flex items-center justify-center bg-coral-soft" style={{
          width: 80, height: 80, borderRadius: 24,
          border: '2px solid var(--ink)',
          marginBottom: 16,
          boxShadow: '3px 4px 0 rgba(0,0,0,0.12)',
        }}>
          <HandIcon kind="target" size={40} color="var(--coral)" />
        </div>
        <h1 className="font-display text-center leading-none" style={{ fontSize: 42 }}>
          Habit Tracker
        </h1>
        <Scribble width={120} style={{ marginTop: 4 }} />
        <p className="font-hand text-ink-soft text-center" style={{ fontSize: 15, marginTop: 12, lineHeight: 1.4 }}>
          Gamifica tus hábitos.<br/>Gana puntos. Construye rachas.
        </p>
      </div>

      {/* Google Button */}
      <a
        href={`${apiBase}/api/auth/google`}
        className="flex items-center justify-center font-hand text-ink bg-paper w-full"
        style={{
          gap: 12,
          fontSize: 17,
          textDecoration: 'none',
          border: '1.8px solid var(--ink)',
          borderRadius: 'var(--radius-pill)',
          padding: '14px 28px',
          boxShadow: '2px 3px 0 rgba(0,0,0,0.12)',
        }}
      >
        <GoogleIcon />
        Continuar con Google
      </a>

      <p className="font-hand text-ink-soft text-center" style={{ fontSize: 12, marginTop: 24 }}>
        Al continuar, aceptas el uso de tus datos para personalizar tu experiencia.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
