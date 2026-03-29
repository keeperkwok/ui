import { Navigate, createBrowserRouter } from 'react-router-dom'
import { token } from '@/utils/token'
import Login from '@/pages/Login'
import Home from '@/pages/Home'

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!token.getAccess()) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  if (token.getAccess()) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Home />
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
