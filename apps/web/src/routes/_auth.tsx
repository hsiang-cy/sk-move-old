import { createFileRoute, Outlet } from '@tanstack/react-router'
import AppLayout from '@/components/layout/AppLayout'

export const Route = createFileRoute('/_auth')({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})
