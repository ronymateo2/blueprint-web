import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Login } from './screens/Login';
import { AuthCallback } from './screens/AuthCallback';
import { Home } from './screens/Home';
import { QuickAction } from './screens/QuickAction';
import { Points } from './screens/Points';
import { History } from './screens/History';
import { CreateHabit } from './screens/CreateHabit';
import { EditHabit } from './screens/EditHabit';
import { Me } from './screens/Me';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-[100dvh] font-hand text-ink-soft">
      Cargando…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/habits/new" element={<ProtectedRoute><CreateHabit /></ProtectedRoute>} />
        <Route path="/habits/:id" element={<ProtectedRoute><QuickAction /></ProtectedRoute>} />
        <Route path="/habits/:id/edit" element={<ProtectedRoute><EditHabit /></ProtectedRoute>} />
        <Route path="/points" element={<ProtectedRoute><Points /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/me" element={<ProtectedRoute><Me /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
