import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'
import { ToastProvider } from './components/ui/toast'
import { Spinner } from './components/ui'
import { AppShell } from './components/layout/AppShell'
import Landing from './pages/Landing'
import Discover from './pages/Discover'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const PostGig = lazy(() => import('./pages/PostGig'))
const GigDetail = lazy(() => import('./pages/GigDetail'))
const MyGigs = lazy(() => import('./pages/MyGigs'))
const MyWork = lazy(() => import('./pages/MyWork'))
const Workers = lazy(() => import('./pages/Workers'))
const WorkerProfile = lazy(() => import('./pages/WorkerProfile'))
const Profile = lazy(() => import('./pages/Profile'))
const Impact = lazy(() => import('./pages/Impact'))
const Verify = lazy(() => import('./pages/Verify'))
const Trust = lazy(() => import('./pages/Trust'))
const NotFound = lazy(() => import('./pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: true },
  },
})

function RequireAuth({ children }: { children: ReactNode }) {
  const { userId, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!userId) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (!profile && location.pathname !== '/profile') return <Navigate to="/profile?setup=1" replace />
  return <>{children}</>
}

function HomeRoute() {
  const { userId, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (userId && profile) return <Navigate to={profile.role === 'customer' ? '/my-gigs' : '/discover'} replace />
  return <Landing />
}

function ConfigError() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-bold">SideGigs is not configured</h1>
      <p className="mt-2 text-muted">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).</p>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <ConfigError />
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<HomeRoute />} />
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="workers" element={<Workers />} />
                  <Route path="gigs/new" element={<RequireAuth><PostGig /></RequireAuth>} />
                  <Route path="gigs/:id" element={<GigDetail />} />
                  <Route path="my-gigs" element={<RequireAuth><MyGigs /></RequireAuth>} />
                  <Route path="my-work" element={<RequireAuth><MyWork /></RequireAuth>} />
                  <Route path="w/:id" element={<WorkerProfile />} />
                  <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="impact" element={<Impact />} />
                  <Route path="verify" element={<Verify />} />
                  <Route path="trust" element={<Trust />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
