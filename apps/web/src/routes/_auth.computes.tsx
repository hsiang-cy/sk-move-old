import { createFileRoute } from '@tanstack/react-router'
import ComputesView from '@/views/ComputesView'

export const Route = createFileRoute('/_auth/computes')({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: ComputesView,
})
