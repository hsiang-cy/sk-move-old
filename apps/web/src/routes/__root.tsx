import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    const isLoginPage = location.pathname === '/login'

    if (!isAuthenticated && !isLoginPage) {
      throw redirect({ to: '/login' })
    }
    if (isAuthenticated && isLoginPage) {
      throw redirect({ to: '/locations' })
    }
  },
  component: () => <Outlet />,
})
