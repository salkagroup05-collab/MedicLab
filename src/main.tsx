import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2 } from 'lucide-react';
import App from './App.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { PublicDirectoryView } from './components/public/PublicDirectoryView.tsx';
import { useSession } from './hooks/useSession.ts';
import './index.css';

function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
    </div>
  );
}

function AuthenticatedRoot() {
  const { session, loading } = useSession();
  if (loading) return <SplashScreen />;
  return session ? <App session={session} /> : <AuthScreen />;
}

function Root() {
  const path = window.location.pathname;
  if (path === '/annuaire') return <PublicDirectoryView />;
  if (path === '/') return <AuthenticatedRoot />;
  return <NotFoundPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
