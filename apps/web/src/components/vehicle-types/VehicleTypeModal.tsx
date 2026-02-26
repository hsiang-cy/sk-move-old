import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useCreateVehicleType, useUpdateVehicleType } from '@/hooks/useVehicleTypes'
import type { VehicleType } from '@/types'

interface Props {
  open: boolean
  editData?: VehicleType | null
  onClose: () => void
}

export default function VehicleTypeModal({ open, editData, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const createType = useCreateVehicleType()
  const updateType = useUpdateVehicleType()

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      setName(editData?.name ?? '')
      setCapacity(editData?.capacity ?? 0)
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open, editData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitError(null)
    try {
      if (editData) {
        await updateType.mutateAsync({ id: editData.id, data: { name: name.trim(), capacity } })
      } else {
        await createType.mutateAsync({ name: name.trim(), capacity })
      }
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '儲存失敗，請稍後再試')
    }
  }

  const isSubmitting = createType.isPending || updateType.isPending

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{editData ? '編輯車輛類型' : '新增車輛類型'}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">
                類型名稱 <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：小貨車、大貨車、福祉車"
              className="input input-bordered w-full"
              required
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">
                最大載貨量 <span className="text-error">*</span>
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min="0"
                step="any"
                placeholder="0"
                className="input input-bordered w-32"
                required
              />
              <span className="text-sm text-base-content/50">單位自訂（例：公斤、箱）</span>
            </div>
          </div>

          {submitError && (
            <div className="alert alert-error py-2.5 text-sm">
              <span>{submitError}</span>
            </div>
          )}

          <div className="modal-action mt-2 pt-2 border-t border-base-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting && <span className="loading loading-spinner loading-xs" />}
              {editData ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>關閉</button>
      </form>
    </dialog>
  )
}
