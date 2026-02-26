import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { computesService } from '@/services/computes'
import type { Compute } from '@/types'

/**
 * 取得計算任務列表
 * 支援可選的 orderId 篩選參數
 * staleTime: 0（需要即時狀態）
 */
export function useComputes(orderId?: string) {
  return useQuery({
    queryKey: ['computes', { orderId }],
    queryFn: () => computesService.getAll(orderId),
    staleTime: 0, // 需要即時狀態
  })
}

/**
 * 取得單一計算任務詳情
 * 實作輪詢邏輯：當狀態為 pending 或 computing 時每 3 秒 refetch
 * 當狀態變為終止狀態時停止輪詢
 */
export function useCompute(computeId: string) {
  return useQuery({
    queryKey: ['compute', computeId],
    queryFn: () => computesService.getById(computeId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      const status = data.compute_status
      // 當狀態為 pending 或 computing 時，每 3 秒輪詢一次
      return (status === 'pending' || status === 'computing') ? 3000 : false
    },
  })
}

/**
 * 建立計算任務
 * 成功後 invalidate ['computes'] cache
 */
export function useCreateCompute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      order_id: string
      data?: Record<string, any>
      comment_for_account?: string
    }) => computesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['computes'] }),
  })
}

/**
 * 取消計算任務
 * 成功後 invalidate ['compute', computeId] 和 ['computes'] cache
 * 處理取消失敗的錯誤（已完成的任務無法取消）
 */
export function useCancelCompute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => computesService.cancel(id),
    onSuccess: (data: Compute) => {
      qc.invalidateQueries({ queryKey: ['compute', data.id] })
      qc.invalidateQueries({ queryKey: ['computes'] })
    },
  })
}

/**
 * 取得計算任務的所有路線
 * staleTime: 5 分鐘（300000 毫秒）
 * 只在 compute_status 為 'completed' 時啟用
 */
export function useComputeRoutes(computeId: string, computeStatus?: string) {
  return useQuery({
    queryKey: ['compute', computeId, 'routes'],
    queryFn: () => computesService.getRoutes(computeId),
    staleTime: 300000, // 5 分鐘
    enabled: computeStatus === 'completed', // 只在 completed 時啟用
  })
}
