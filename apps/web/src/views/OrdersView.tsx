import { useRef, useState } from 'react'
import { Plus, Eye, Trash2, FileText, ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useOrders, useDeleteOrder } from '@/hooks/useOrders'
import OrderFormModal from '@/components/orders/OrderFormModal'
import OrderDetailModal from '@/components/orders/OrderDetailModal'
import { formatTimestamp } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrdersView() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading, error, refetch } = useOrders()
  const deleteOrder = useDeleteOrder()

  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  function openDetail(order: Order) {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  function confirmDelete(order: Order) {
    setDeletingOrder(order)
    deleteDialogRef.current?.showModal()
  }

  async function handleDelete() {
    if (!deletingOrder) return
    await deleteOrder.mutateAsync(deletingOrder.id)
    deleteDialogRef.current?.close()
    setDeletingOrder(null)
  }

  function goToComputes(orderId: string) {
    navigate({ to: '/computes', search: { orderId } })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">訂單管理</h1>
          <p className="text-base-content/50 text-sm mt-1">建立與管理配送訂單</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => setShowFormModal(true)}>
          <Plus className="w-4 h-4" />
          建立訂單
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()}>重試</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="border-b border-base-200 bg-base-50 text-xs text-base-content/60 uppercase tracking-wider">
                  <th className="font-semibold">訂單 ID</th>
                  <th className="font-semibold">建立時間</th>
                  <th className="font-semibold">地點數量</th>
                  <th className="font-semibold">車輛數量</th>
                  <th className="font-semibold">狀態</th>
                  <th className="font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                        <FileText className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">尚無訂單</p>
                        <p className="text-sm mt-1">點擊右上角「建立訂單」開始建立</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-base-50 border-b border-base-100 last:border-0">
                    <td className="font-medium font-mono text-sm">{order.id}</td>
                    <td className="text-sm">{formatTimestamp(order.created_at)}</td>
                    <td className="text-sm">{order.destination_snapshot.length}</td>
                    <td className="text-sm">{order.vehicle_snapshot.length}</td>
                    <td>
                      <span className={`badge badge-sm ${
                        order.status === 'active' ? 'badge-success' : 'badge-ghost'
                      }`}>
                        {order.status === 'active' ? '有效' : order.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip="查看詳情"
                          onClick={() => openDetail(order)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip="前往計算"
                          onClick={() => goToComputes(order.id)}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error/60 hover:text-error tooltip"
                          data-tip="刪除"
                          onClick={() => confirmDelete(order)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length > 0 && (
            <div className="px-4 py-2.5 border-t border-base-200 text-xs text-base-content/40">
              共 {orders.length} 筆訂單
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <OrderFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
      />

      {/* Detail Modal */}
      <OrderDetailModal
        open={showDetailModal}
        order={selectedOrder}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Delete Confirm Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="modal"
        onClose={() => setDeletingOrder(null)}
      >
        <div className="modal-box max-w-sm">
          <h3 className="font-semibold text-base mb-2">確認刪除</h3>
          <p className="text-sm text-base-content/70">
            確定要刪除訂單「<strong>{deletingOrder?.id}</strong>」嗎？<br />
            此操作無法復原。
          </p>
          <div className="modal-action mt-5 pt-4 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={() => deleteDialogRef.current?.close()}>
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              disabled={deleteOrder.isPending}
              onClick={handleDelete}
            >
              {deleteOrder.isPending && <span className="loading loading-spinner loading-xs" />}
              確認刪除
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>關閉</button>
        </form>
      </dialog>
    </div>
  )
}
