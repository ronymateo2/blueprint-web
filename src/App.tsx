import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavProvider>
          <AppLayout />
        </NavProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
