import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from './hooks/useSession.ts';

// Chaque écran est chargé à la demande : un visiteur de la page d'accueil ne
// télécharge pas l'application du cabinet, et inversement.
const App = lazy(() => import('./App.tsx'));
const AuthScreen = lazy(() => import('./components/AuthScreen.tsx').then((m) => ({ default: m.AuthScreen })));
const LandingPage = lazy(() => import('./components/LandingPage.tsx').then((m) => ({ default: m.LandingPage })));
const NotFoundPage = lazy(() => import('./components/NotFoundPage.tsx').then((m) => ({ default: m.NotFoundPage })));
const PublicDirectoryView = lazy(() =>
  import('./components/public/PublicDirectoryView.tsx').then((m) => ({ default: m.PublicDirectoryView }))
);
const ResetPasswordScreen = lazy(() =>
  import('./components/ResetPasswordScreen.tsx').then((m) => ({ default: m.ResetPasswordScreen }))
);

function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
    </div>
  );
}

function HomeRoot() {
  const { session, loading, isRecovery } = useSession();
  if (loading) return <SplashScreen />;
  if (!session) return <LandingPage />;
  return isRecovery ? <ResetPasswordScreen /> : <App key={session.user.id} session={session} />;
}

function AuthRoot({ mode }: { mode: 'signIn' | 'signUp' }) {
  const { session, loading, isRecovery } = useSession();
  if (loading) return <SplashScreen />;
  if (!session) return <AuthScreen initialMode={mode} />;
  return isRecovery ? <ResetPasswordScreen /> : <App key={session.user.id} session={session} />;
}

function Routes() {
  const path = window.location.pathname;
  if (path === '/annuaire') return <PublicDirectoryView />;
  if (path === '/connexion') return <AuthRoot mode="signIn" />;
  if (path === '/inscription') return <AuthRoot mode="signUp" />;
  if (path === '/') return <HomeRoot />;
  return <NotFoundPage />;
}

export function Root() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes />
    </Suspense>
  );
}
