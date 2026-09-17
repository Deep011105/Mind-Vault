import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Insights from './pages/Insights';
import PinSetup from './pages/PinSetup';
import PinLock from './pages/PinLock';
import Goals from './pages/Goals';
import Planner from './pages/Planner';
import { getAuthStatus } from './api/auth';
import { getToken } from './api/client';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth routes — always accessible so the guard can redirect here */}
            <Route path="/setup" element={<PinSetup />} />
            <Route path="/lock"  element={<PinLock />}  />

            {/* All other routes are gated behind the auth guard */}
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

/**
 * Wraps the main app routes with an auth check.
 *
 * On mount it calls GET /api/auth/status:
 *  - PIN not configured → /setup  (first launch)
 *  - PIN configured, no token    → /lock   (returning user, session expired)
 *  - PIN configured, token present → renders normally (token validity is
 *    confirmed lazily on the first real API call; if stale, the 401 interceptor
 *    in client.ts will redirect to /lock automatically)
 */
function ProtectedRoutes() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAuthStatus()
      .then(({ pinConfigured }) => {
        if (!pinConfigured) {
          navigate('/setup', { replace: true });
        } else if (!getToken()) {
          navigate('/lock', { replace: true });
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        // If the backend is unreachable we still show the app (it will fail
        // naturally on the next data fetch). Don't block the UI indefinitely.
        setReady(true);
      });
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-night">
        <p className="text-sm text-ink-faint dark:text-mist-soft/70">Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"         element={<Dashboard />} />
      <Route path="/planner"  element={<Planner />}   />
      <Route path="/goals"    element={<Goals />}     />
      <Route path="/chat"     element={<Chat />}      />
      <Route path="/insights" element={<Insights />}  />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
