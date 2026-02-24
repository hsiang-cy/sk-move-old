import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useLocations } from '@/hooks/useLocations'
import { useVehicles } from '@/hooks/useVehicles'
import { useCreateOrder } from '@/hooks/useOrders'
import type { DestinationSnapshot, VehicleSnapshot } from '@/types'

interface OrderFormModalProps {
  open: boolean
  onClose: () => void
}

export default function OrderFormModal({ open, onClose }: OrderFormModalProps) {
  const { data: locations = [] } = useLocations()
  const { data: vehicles = [] } = useVehicles()
  const createOrder = useCreateOrder()
  const [comment, setComment] = useState('')

  // 驗證：至少 1 個地點和車輛
  const canCreate = locations.length > 0 && vehicles.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreate) return

    // 建立快照
    const destination_snapshot: DestinationSnapshot[] = locations.map(loc => ({
      id: parseInt(loc.id),
      name: loc.name,
      address: loc.address,
      lat: String(loc.latitude),
      lng: String(loc.longitude),
      service_time: loc.dwellTime,
      delivery: loc.cargoDemand,
      // 時間視窗：使用第一個時間視窗，轉換為分鐘
      time_window_start: loc.timeWindows[0] ? timeToMinutes(loc.timeWindows[0].start) : undefined,
      time_window_end: loc.timeWindows[0] ? timeToMinutes(loc.timeWindows[0].end) : undefined,
    }))

    const vehicle_snapshot: VehicleSnapshot[] = vehicles.map(v => ({
      id: parseInt(v.id),
      vehicle_number: v.licensePlate,
      capacity: v.cargoCapacity,
    }))

    await createOrder.mutateAsync({
      destination_snapshot,
      vehicle_snapshot,
      comment_for_account: comment || undefined,
    })

    onClose()
    setComment('')
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  if (!open) return null

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-semibold text-lg mb-4">建立訂單</h3>
        
        {/* 警告：無地點或車輛 */}
        {!canCreate && (
          <div className="alert alert-warning mb-4">
            <AlertCircle className="w-5 h-5" />
            <div className="flex flex-col gap-1">
              {locations.length === 0 && <span>請先建立至少一個地點</span>}
              {vehicles.length === 0 && <span>請先建立至少一輛車輛</span>}
            </div>
          </div>
        )}

        {/* 顯示當前地點列表（唯讀預覽） */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text font-medium">地點快照（{locations.length} 個）</span>
          </label>
          <div className="max-h-40 overflow-y-auto border border-base-200 rounded-lg p-2 bg-base-50">
            {locations.length === 0 ? (
              <div className="text-sm text-base-content/50 py-2 text-center">尚無地點</div>
            ) : (
              locations.map(loc => (
                <div key={loc.id} className="text-sm py-1 px-2 hover:bg-base-100 rounded">
                  {loc.name} - {loc.address}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 顯示當前車輛列表（唯讀預覽） */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text font-medium">車輛快照（{vehicles.length} 輛）</span>
          </label>
          <div className="max-h-40 overflow-y-auto border border-base-200 rounded-lg p-2 bg-base-50">
            {vehicles.length === 0 ? (
              <div className="text-sm text-base-content/50 py-2 text-center">尚無車輛</div>
            ) : (
              vehicles.map(v => (
                <div key={v.id} className="text-sm py-1 px-2 hover:bg-base-100 rounded">
                  {v.name} - {v.licensePlate} (容量: {v.cargoCapacity})
                </div>
              ))
            )}
          </div>
        </div>

        {/* 備註欄位 */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text">備註</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="選填"
            rows={3}
          />
        </div>

        {/* 按鈕 */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            className="btn btn-primary"
            disabled={!canCreate || createOrder.isPending}
            onClick={handleSubmit}
          >
            {createOrder.isPending && <span className="loading loading-spinner loading-xs" />}
            建立訂單
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>關閉</button>
      </form>
    </dialog>
  )
}
