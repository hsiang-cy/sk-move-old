import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleTypesService } from '@/services/vehicleTypes'
import type { VehicleType } from '@/types'

export function useVehicleTypes() {
  return useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: vehicleTypesService.getAll,
  })
}

export function useCreateVehicleType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<VehicleType, 'id'>) => vehicleTypesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicleTypes'] }),
  })
}

export function useUpdateVehicleType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<VehicleType, 'id'> }) =>
      vehicleTypesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicleTypes'] }),
  })
}

export function useDeleteVehicleType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vehicleTypesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicleTypes'] }),
  })
}
