import { createFileRoute } from '@tanstack/react-router'
import VehiclesView from '@/views/VehiclesView'

export const Route = createFileRoute('/_auth/vehicles')({
  component: VehiclesView,
})
