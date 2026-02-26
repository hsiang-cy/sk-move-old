import { createFileRoute } from '@tanstack/react-router'
import LocationsView from '@/views/LocationsView'

export const Route = createFileRoute('/_auth/locations')({
  component: LocationsView,
})
