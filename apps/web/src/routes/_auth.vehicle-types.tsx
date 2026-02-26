import { createFileRoute } from '@tanstack/react-router'
import VehicleTypesView from '@/views/VehicleTypesView'

export const Route = createFileRoute('/_auth/vehicle-types')({
  component: VehicleTypesView,
})
