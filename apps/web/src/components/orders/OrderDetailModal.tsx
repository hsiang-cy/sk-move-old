import { ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { Order } from '@/types'

interface OrderDetailModalProps {
  open: boolean
  order: Order | null
  onClose: () => void
}

export default function OrderDetailModal({ open, order, onClose }: OrderDetailModalProps) {
  const navigate = useNavigate()

  if (!open || !order) return null

  function goToComputes() {
    // TODO: 實作前往計算頁面（需要先建立 /computes 路由）
    if (!order) return
    console.log('前往計算頁面，訂單 ID:', order.id)
    onClose()
  }

  function formatTimestamp(timestamp: number | null) {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-semibold text-lg mb-4">訂單詳情</h3>

        {/* 基本資訊 */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-base-content/50">訂單 ID</span>
              <p className="font-medium font-mono">{order.id}</p>
            </div>
            <div>
              <span className="text-sm text-base-content/50">建立時間</span>
              <p className="font-medium">{formatTimestamp(order.created_at)}</p>
            </div>
            <div>
              <span className="text-sm text-base-content/50">狀態</span>
              <p>
                <span className={`badge badge-sm ${
                  order.status === 'active' ? 'badge-success' : 'badge-ghost'
                }`}>
                  {order.status === 'active' ? '有效' : order.status}
                </span>
              </p>
            </div>
            {order.comment_for_account && (
              <div className="col-span-2">
                <span className="text-sm text-base-content/50">備註</span>
                <p className="font-medium">{order.comment_for_account}</p>
              </div>
            )}
          </div>
        </div>

        {/* 地點快照 */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">地點快照（{order.destination_snapshot.length} 個）</h4>
          <div className="overflow-x-auto border border-base-200 rounded-lg">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-50">
                  <th>名稱</th>
                  <th>地址</th>
                  <th>經緯度</th>
                  <th>需求量</th>
                </tr>
              </thead>
              <tbody>
                {order.destination_snapshot.map((dest, i) => (
                  <tr key={i} className="hover:bg-base-50">
                    <td className="font-medium">{dest.name}</td>
                    <td className="max-w-xs truncate" title={dest.address}>{dest.address}</td>
                    <td className="text-xs font-mono">{dest.lat}, {dest.lng}</td>
                    <td>{dest.delivery || dest.pickup || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 車輛快照 */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">車輛快照（{order.vehicle_snapshot.length} 輛）</h4>
          <div className="overflow-x-auto border border-base-200 rounded-lg">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-50">
                  <th>車牌號碼</th>
                  <th>容量</th>
                </tr>
              </thead>
              <tbody>
                {order.vehicle_snapshot.map((v, i) => (
                  <tr key={i} className="hover:bg-base-50">
                    <td className="font-medium font-mono">{v.vehicle_number}</td>
                    <td>{v.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>關閉</button>
          <button className="btn btn-primary gap-2" onClick={goToComputes}>
            前往計算
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>關閉</button>
      </form>
    </dialog>
  )
}
