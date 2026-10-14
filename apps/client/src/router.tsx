import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AssistantPage, ChapterOverviewPage, ChapterReaderPage, CoursesPage, DashboardPage, ExamsPage, LandingPage, LoginPage, OnboardingPage, PlanningPage, RegisterPage, RevisionsPage, SettingsPage } from './pages';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { element: <GuestRoute />, children: [{ path: '/sign-in', element: <LoginPage /> }, { path: '/sign-up', element: <RegisterPage /> }] },
  { element: <ProtectedRoute />, children: [
    { path: '/onboarding', element: <OnboardingPage /> },
    { path: '/dashboard', element: <DashboardLayout />, children: [
      { index: true, element: <DashboardPage /> }, { path: 'course', element: <CoursesPage /> },
      { path: 'planning', element: <PlanningPage /> }, { path: 'revisions', element: <RevisionsPage /> },
      { path: 'examens', element: <ExamsPage /> }, { path: 'examens/:examId', element: <ExamsPage /> },
      { path: 'assistant', element: <AssistantPage /> }, { path: 'settings', element: <SettingsPage /> },
      { path: 'courses/:courseId/chapter/:chapterId', element: <ChapterOverviewPage /> },
      { path: 'courses/:courseId/chapter/:chapterId/view', element: <ChapterReaderPage /> },
    ] },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
]);
