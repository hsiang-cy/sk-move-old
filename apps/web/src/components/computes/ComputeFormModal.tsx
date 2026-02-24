import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { useCreateCompute } from '@/hooks/useComputes'

interface ComputeFormModalProps {
  open: boolean
  defaultOrderId: string | undefined
  onClose: () => void
}

export default function ComputeFormModal({ open, defaultOrderId, onClose }: ComputeFormModalProps) {
  const { data: orders = [] } = useOrders()
  const createCompute = useCreateCompute()

  const [orderId, setOrderId] = useState(defaultOrderId ?? '')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId) {
      setError('請選擇訂單')
      return
    }
    setError(null)
    try {
      await createCompute.mutateAsync({
        order_id: orderId,
        comment_for_account: comment || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '觸發計算失敗')
    }
  }

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-semibold text-lg mb-4">觸發計算</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">訂單</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">請選擇訂單</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id}
                  {order.comment_for_account ? ` — ${order.comment_for_account}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">備註（可選）</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="填寫備註..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action mt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createCompute.isPending}
            >
              {createCompute.isPending && <span className="loading loading-spinner loading-xs" />}
              觸發計算
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>關閉</button>
      </form>
    </dialog>
  )
}
