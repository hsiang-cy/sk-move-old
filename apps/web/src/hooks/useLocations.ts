import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationsService } from '@/services/locations'
import type { Location } from '@/types'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: locationsService.getAll,
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Location, 'id'>) => locationsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Location, 'id'> }) =>
      locationsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => locationsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}
