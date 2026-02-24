import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '@/services/orders'
import type { Order, DestinationSnapshot, VehicleSnapshot } from '@/types'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getAll,
    staleTime: 30000, // 30 秒
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getById(orderId),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      destination_snapshot: DestinationSnapshot[]
      vehicle_snapshot: VehicleSnapshot[]
      comment_for_account?: string
    }) => ordersService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
