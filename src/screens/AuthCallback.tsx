import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.me()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate]);

  return (
    <div className="screen items-center justify-center">
      <span className="font-hand text-ink-soft" style={{ fontSize: 16 }}>
        Iniciando sesión…
      </span>
    </div>
  );
}
