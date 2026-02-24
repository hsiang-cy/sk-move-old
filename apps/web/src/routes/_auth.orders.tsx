import { createFileRoute } from '@tanstack/react-router'
import OrdersView from '@/views/OrdersView'

export const Route = createFileRoute('/_auth/orders')({
  component: OrdersView,
})
