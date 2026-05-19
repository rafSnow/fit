import { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import AppRouter from './Router';
import './index.css';
import { useTheme } from './hooks/useTheme';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { db } from './lib/db';

function App() {
  const { theme } = useTheme();
  const [isOnboarding, setIsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const setting = await db.settings.get('onboarding_complete');
      setIsOnboarding(!setting?.value);
    };
    checkOnboarding();
  }, []);

  if (isOnboarding === null) return null;
  
  return (
    <div className={theme}>
      <HashRouter>
        {isOnboarding ? (
          <OnboardingPage onComplete={() => setIsOnboarding(false)} />
        ) : (
          <AppShell>
            <ErrorBoundary>
              <AppRouter />
            </ErrorBoundary>
          </AppShell>
        )}
      </HashRouter>
    </div>
  );
}

export default App;
