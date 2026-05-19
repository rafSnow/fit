import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner } from './components/ui/Spinner';

// Lazy load pages
const CardioListPage = lazy(() => import('./pages/cardio/CardioListPage'));
const CardioFormPage = lazy(() => import('./pages/cardio/CardioFormPage'));
const CardioDetailPage = lazy(() => import('./pages/cardio/CardioDetailPage'));
const WorkoutHomePage = lazy(() => import('./pages/workout/WorkoutHomePage'));
const WorkoutActivePage = lazy(() => import('./pages/workout/WorkoutActivePage'));
const WorkoutSummaryPage = lazy(() => import('./pages/workout/WorkoutSummaryPage'));
const ExerciseListPage = lazy(() => import('./pages/workout/ExerciseListPage'));
const ExerciseFormPage = lazy(() => import('./pages/workout/ExerciseFormPage'));
const ExerciseDetailPage = lazy(() => import('./pages/workout/ExerciseDetailPage'));
const ExerciseHistoryPage = lazy(() => import('./pages/workout/ExerciseHistoryPage'));
const RoutineListPage = lazy(() => import('./pages/workout/RoutineListPage'));
const RoutineFormPage = lazy(() => import('./pages/workout/RoutineFormPage'));
const RoutineDetailPage = lazy(() => import('./pages/workout/RoutineDetailPage'));
const RoutineExerciseFormPage = lazy(() => import('./pages/workout/RoutineExerciseFormPage'));
const MetricsDashboardPage = lazy(() => import('./pages/metrics/MetricsDashboardPage'));
const MetricsFormPage = lazy(() => import('./pages/metrics/MetricsFormPage'));
const MetricsHistoryPage = lazy(() => import('./pages/metrics/MetricsHistoryPage'));
const MetricsPhotosPage = lazy(() => import('./pages/metrics/MetricsPhotosPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const BackupPage = lazy(() => import('./pages/settings/BackupPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <Spinner className="h-8 w-8 text-blue-500" />
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default function AppRouter() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/cardio" replace />} />
          
          {/* Cardio */}
          <Route path="/cardio" element={<PageWrapper><CardioListPage /></PageWrapper>} />
          <Route path="/cardio/new" element={<PageWrapper><CardioFormPage /></PageWrapper>} />
          <Route path="/cardio/:id" element={<PageWrapper><CardioDetailPage /></PageWrapper>} />
          <Route path="/cardio/:id/edit" element={<PageWrapper><CardioFormPage /></PageWrapper>} />      
          
          {/* Workout */}
          <Route path="/workout" element={<PageWrapper><WorkoutHomePage /></PageWrapper>} />
          <Route path="/workout/active" element={<PageWrapper><WorkoutActivePage /></PageWrapper>} />
          <Route path="/workout/summary/:id" element={<PageWrapper><WorkoutSummaryPage /></PageWrapper>} />
          
          {/* Exercises */}
          <Route path="/exercises" element={<PageWrapper><ExerciseListPage /></PageWrapper>} />
          <Route path="/exercises/new" element={<PageWrapper><ExerciseFormPage /></PageWrapper>} />
          <Route path="/exercises/:id" element={<PageWrapper><ExerciseDetailPage /></PageWrapper>} />
          <Route path="/exercises/:id/edit" element={<PageWrapper><ExerciseFormPage /></PageWrapper>} />
          <Route path="/exercises/:id/history" element={<PageWrapper><ExerciseHistoryPage /></PageWrapper>} />
          
          {/* Routines */}
          <Route path="/routines" element={<PageWrapper><RoutineListPage /></PageWrapper>} />
          <Route path="/routines/new" element={<PageWrapper><RoutineFormPage /></PageWrapper>} />
          <Route path="/routines/:id" element={<PageWrapper><RoutineDetailPage /></PageWrapper>} />
          <Route path="/routines/:id/edit" element={<PageWrapper><RoutineFormPage /></PageWrapper>} />
          <Route path="/routines/:routineId/exercises/:reId" element={<PageWrapper><RoutineExerciseFormPage /></PageWrapper>} />
          
          {/* Metrics */}
          <Route path="/metrics" element={<PageWrapper><MetricsDashboardPage /></PageWrapper>} />
          <Route path="/metrics/new" element={<PageWrapper><MetricsFormPage /></PageWrapper>} />
          <Route path="/metrics/history" element={<PageWrapper><MetricsHistoryPage /></PageWrapper>} />
          <Route path="/metrics/photos" element={<PageWrapper><MetricsPhotosPage /></PageWrapper>} />
          
          {/* Settings */}
          <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route path="/settings/backup" element={<PageWrapper><BackupPage /></PageWrapper>} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<PageWrapper><OnboardingPage onComplete={() => window.location.href = '/'} /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
