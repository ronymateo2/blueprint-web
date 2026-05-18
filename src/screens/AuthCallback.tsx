import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('habit_token', token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, location.search]);

  return (
    <div className="screen items-center justify-center">
      <span className="font-hand text-ink-soft" style={{ fontSize: 16 }}>
        Iniciando sesión…
      </span>
    </div>
  );
}
