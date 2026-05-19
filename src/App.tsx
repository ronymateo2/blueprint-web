import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { NavProvider, useNavDirection, type NavDirection } from './context/NavContext';
import { TabBar } from './components/TabBar';
import { Login } from './screens/Login';
import { AuthCallback } from './screens/AuthCallback';
import { Home } from './screens/Home';
import { QuickAction } from './screens/QuickAction';
import { Points } from './screens/Points';
import { History } from './screens/History';
import { CreateHabit } from './screens/CreateHabit';
import { EditHabit } from './screens/EditHabit';
import { Me } from './screens/Me';
import { Archive } from './screens/Archive';
import { HabitHistory } from './screens/HabitHistory';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return (
    <div className="flex items-center justify-center h-[100dvh] font-hand text-ink-soft">
      Cargando…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const ANIM: Record<NavDirection, string> = {
  right: 'screenEnterRight',
  left:  'screenEnterLeft',
  up:    'screenFade',
};

const TAB_ROUTES = new Set(['/', '/history', '/points', '/me']);

function AppLayout() {
  const location = useLocation();
  const { getDirection, setDirection } = useNavDirection();

  useEffect(() => {
    const t = setTimeout(() => setDirection('up'), 350);
    return () => clearTimeout(t);
  }, [location.key, setDirection]);

  const anim = ANIM[getDirection()] ?? 'screenFade';
  // show tabbar on main tabs + quickaction (but not on sub-screens or login)
  const showTabBar = TAB_ROUTES.has(location.pathname) ||
    /^\/habits\/[^/]+$/.test(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div
        key={location.key}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          animation: `${anim} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/habits/new" element={<ProtectedRoute><CreateHabit /></ProtectedRoute>} />
          <Route path="/habits/archived" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
          <Route path="/habits/:id" element={<ProtectedRoute><QuickAction /></ProtectedRoute>} />
          <Route path="/habits/:id/history" element={<ProtectedRoute><HabitHistory /></ProtectedRoute>} />
          <Route path="/habits/:id/edit" element={<ProtectedRoute><EditHabit /></ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute><Points /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><Me /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showTabBar && <TabBar />}
    </div>
  );
}

export function App() {
  useEffect(() => {
    const display = localStorage.getItem('habit_display_font');
    if (display) document.documentElement.style.setProperty('--font-display', display);
    const hand = localStorage.getItem('habit_hand_font');
    if (hand) document.documentElement.style.setProperty('--font-hand', hand);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <NavProvider>
          <AppLayout />
        </NavProvider>
        <Toaster
          position="top-center"
          duration={4000}
          toastOptions={{
            style: {
              background: 'var(--color-paper-2)',
              color: 'var(--color-ink)',
              border: '1.8px solid var(--color-ink)',
              borderRadius: '14px',
              boxShadow: '2px 3px 0 rgba(0,0,0,0.08)',
              fontFamily: 'var(--font-hand)',
              fontSize: '17px',
              padding: '10px 14px',
            },
            actionButtonStyle: {
              background: 'transparent',
              color: 'var(--color-coral)',
              border: '1.5px solid var(--color-coral)',
              borderRadius: '999px',
              fontFamily: 'var(--font-hand)',
              fontSize: '14px',
              padding: '4px 12px',
              cursor: 'pointer',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
