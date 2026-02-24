import type { ComputeStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface ComputeStatusBadgeProps {
  status: ComputeStatus
  className?: string
}

export function ComputeStatusBadge({ status, className = '' }: ComputeStatusBadgeProps) {
  const statusConfig = {
    initial: { color: 'badge-ghost', text: '初始', icon: null },
    pending: { color: 'badge-ghost', text: '等待中', icon: null },
    computing: { color: 'badge-info', text: '計算中', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { color: 'badge-success', text: '已完成', icon: null },
    failed: { color: 'badge-error', text: '失敗', icon: null },
    cancelled: { color: 'badge-warning', text: '已取消', icon: null },
  }

  const config = statusConfig[status] || statusConfig.initial

  return (
    <span className={`badge ${config.color} gap-1 ${className}`}>
      {config.icon}
      {config.text}
    </span>
  )
}
